import type { Expression } from './expression';
import { CollectionToken, EmptyToken, SeparatorToken, StringToken, Token } from './tokens';

import { wrapQuotes } from './naming';

// frame_start / frame_end:
//   UNBOUNDED PRECEDING | offset PRECEDING | CURRENT ROW | offset FOLLOWING | UNBOUNDED FOLLOWING
// Postgres rejects UNBOUNDED FOLLOWING as a start and UNBOUNDED PRECEDING as an end.
type OffsetBound = { preceding: number } | { following: number };
export type WindowFrameStart = 'UNBOUNDED PRECEDING' | 'CURRENT ROW' | OffsetBound;
export type WindowFrameEnd = 'CURRENT ROW' | 'UNBOUNDED FOLLOWING' | OffsetBound;
export type WindowFrameBound = WindowFrameStart | WindowFrameEnd;

export interface WindowFrame {
  mode: 'ROWS' | 'RANGE' | 'GROUPS';
  start: WindowFrameStart;
  // When omitted, Postgres uses CURRENT ROW as the end of the frame.
  end?: WindowFrameEnd;
  exclude?: 'CURRENT ROW' | 'GROUP' | 'TIES' | 'NO OTHERS';
}

// [ existing_window_name ]
// [ PARTITION BY expression [, ...] ]
// [ ORDER BY expression [ ASC | DESC | USING operator ] [ NULLS { FIRST | LAST } ] [, ...] ]
// [ frame_clause ]
export interface WindowDefinition {
  existingWindow?: string;
  partitionBy?: Expression<any, any, any>[];
  orderBy?: Expression<any, any, any>[];
  frame?: WindowFrame;
}

const windowNameRe = /^[A-Za-z_][A-Za-z0-9_]*$/;

export const windowNameToken = (name: string): Token => {
  if (!windowNameRe.test(name)) {
    throw new Error(
      `Invalid window name ${JSON.stringify(name)}. Window names must match ${windowNameRe}.`,
    );
  }

  return new StringToken(wrapQuotes(name));
};

const frameBoundToTokens = (bound: WindowFrameBound): Token[] => {
  if (typeof bound === `string`) {
    return [new StringToken(bound)];
  }

  const [offset, direction] =
    'preceding' in bound ? [bound.preceding, `PRECEDING`] : [bound.following, `FOLLOWING`];

  // Offsets are written inline rather than as parameters: they are plain non-negative integers, so
  // this cannot inject SQL, and it keeps the frame readable in query plans and logs.
  if (!Number.isSafeInteger(offset) || offset < 0) {
    throw new Error(`Window frame offset must be a non-negative integer, got ${offset}.`);
  }

  return [new StringToken(`${offset} ${direction}`)];
};

const frameToTokens = (frame: WindowFrame): Token[] => {
  if ((frame.start as WindowFrameBound) === `UNBOUNDED FOLLOWING`) {
    throw new Error(`A window frame cannot start at UNBOUNDED FOLLOWING.`);
  }
  if ((frame.end as WindowFrameBound | undefined) === `UNBOUNDED PRECEDING`) {
    throw new Error(`A window frame cannot end at UNBOUNDED PRECEDING.`);
  }

  const bounds = frame.end
    ? [
        new StringToken(`BETWEEN`),
        ...frameBoundToTokens(frame.start),
        new StringToken(`AND`),
        ...frameBoundToTokens(frame.end),
      ]
    : frameBoundToTokens(frame.start);

  return [
    new StringToken(frame.mode),
    ...bounds,
    frame.exclude ? new StringToken(`EXCLUDE ${frame.exclude}`) : new EmptyToken(),
  ];
};

const expressionList = (expressions: Expression<any, any, any>[]) =>
  new SeparatorToken(
    `,`,
    expressions.map((expression) => new CollectionToken(expression.toTokens())),
  );

/** @internal */
export const windowDefinitionToTokens = (definition: WindowDefinition): Token[] => {
  const tokens: Token[] = [];

  if (definition.existingWindow !== undefined) {
    if (definition.partitionBy && definition.partitionBy.length > 0) {
      // Postgres: "cannot override PARTITION BY clause of window".
      throw new Error(`A window that refines existingWindow cannot set partitionBy.`);
    }
    tokens.push(windowNameToken(definition.existingWindow));
  }

  if (definition.partitionBy && definition.partitionBy.length > 0) {
    tokens.push(new StringToken(`PARTITION BY`), expressionList(definition.partitionBy));
  }

  if (definition.orderBy && definition.orderBy.length > 0) {
    tokens.push(new StringToken(`ORDER BY`), expressionList(definition.orderBy));
  }

  if (definition.frame) {
    tokens.push(...frameToTokens(definition.frame));
  }

  return tokens;
};
