import {
  AllStarToken,
  CollectionToken,
  EmptyToken,
  GroupToken,
  ParameterToken,
  SeparatorToken,
  StringToken,
  createQueryState,
  TableStarToken,
  Token,
} from './tokens';
import { AnyNumber, Float8, Int4, Int8 } from './data-types';
import type { ColumnSet } from './column';
import { DefaultExpression, Expression } from './expression';

import { Query } from './query';
import { Table } from './TableType';

export interface Tokenable {
  toTokens(): Token[];
}

export const isTokenable = (value: any): value is Tokenable =>
  value && typeof value === 'object' && 'toTokens' in value && typeof value.toTokens === `function`;

export class Star {
  private _starBrand: any;

  constructor(private readonly table?: Table<any, any>) {}

  toTokens() {
    if (this.table) {
      return [new TableStarToken(this.table)];
    }

    return [new AllStarToken()];
  }

  getName() {
    return `*`;
  }
}

export function raw<DataType, IsNotNull extends boolean = false, Name extends string = '?column?'>(
  strings: TemplateStringsArray,
  ...parameters: any[]
) {
  const tokens = strings.flatMap((string, index) => {
    if (index === strings.length - 1) {
      return [new StringToken(string)];
    }

    const parameter = parameters[index];
    return [new StringToken(string), new ParameterToken(parameter)];
  });

  return new Expression<DataType, IsNotNull, Name>(tokens, '' as any);
}

export function star(): Star;
export function star<T extends Table<any, any>>(
  table: T,
): T extends Table<any, infer Columns> ? ColumnSet<Columns> : never;
export function star(table?: Table<any, any>) {
  if (table) {
    return new Star(table) as any;
  }

  return new Star();
}

export const stringAgg = (
  expression: Expression<string, boolean, any>,
  delimiter: string,
  ...orderBy: Expression<any, any, any>[]
): Expression<string, false, 'stringAgg'> => {
  return new Expression(
    [
      new StringToken(`string_agg`),
      new GroupToken([
        new SeparatorToken(',', [
          new CollectionToken(expression.toTokens(false)),
          new CollectionToken([
            new ParameterToken(delimiter),
            orderBy
              ? new CollectionToken([
                  new StringToken(`ORDER BY`),
                  new SeparatorToken(
                    `,`,
                    orderBy.map((expression) => new CollectionToken(expression.toTokens())),
                  ),
                ])
              : new EmptyToken(),
          ]),
        ]),
      ]),
    ],
    'stringAgg',
  );
};

export const bitAnd = <T extends AnyNumber>(expression: Expression<T, boolean, any>) =>
  new Expression<T, false, 'bitAnd'>(
    [new StringToken(`bit_and`), new GroupToken(expression.toTokens(false))],
    'bitAnd',
  );
export const bitOr = <T extends AnyNumber>(expression: Expression<T, boolean, any>) =>
  new Expression<T, false, 'bitOr'>(
    [new StringToken(`bit_or`), new GroupToken(expression.toTokens(false))],
    'bitOr',
  );

export const boolAnd = (expression: Expression<boolean, boolean, any>) =>
  new Expression<number, false, 'boolAnd'>(
    [new StringToken(`bool_and`), new GroupToken(expression.toTokens(false))],
    'boolAnd',
  );

export const boolOr = (expression: Expression<boolean, boolean, any>) =>
  new Expression<number, false, 'boolOr'>(
    [new StringToken(`bool_or`), new GroupToken(expression.toTokens(false))],
    'boolOr',
  );

export const every = (expression: Expression<boolean, boolean, any>) =>
  new Expression<number, false, 'every'>(
    [new StringToken(`every`), new GroupToken(expression.toTokens(false))],
    'every',
  );

export const arrayAgg = <DataType>(expression: Expression<DataType, boolean, any>) =>
  new Expression<DataType[], false, 'arrayAgg'>(
    [new StringToken(`array_agg`), new GroupToken(expression.toTokens(false))],
    'arrayAgg',
  );

export const count = (expression?: Expression<any, any, any>): Expression<Int8, true, 'count'> => {
  if (!expression) {
    return new Expression<Int8, true, 'count'>([new StringToken(`COUNT(*)`)], 'count');
  }

  const tokens = expression.toTokens();

  return new Expression<Int8, true, 'count'>(
    [new StringToken(`COUNT`), new GroupToken(tokens)],
    'count',
  );
};

export const min = <DataType>(
  expression: Expression<DataType, boolean, any>,
): Expression<DataType, false, 'min'> =>
  new Expression<DataType, false, 'min'>(
    [new StringToken(`MIN`), new GroupToken(expression.toTokens())],
    'min',
  );

export const max = <DataType>(expression: Expression<DataType, boolean, any>) =>
  new Expression<DataType, false, 'max'>(
    [new StringToken(`MAX`), new GroupToken(expression.toTokens())],
    'max',
  );

export const avg = <T extends AnyNumber>(expression: Expression<T, boolean, any>) =>
  new Expression<T, false, 'avg'>(
    [new StringToken(`AVG`), new GroupToken(expression.toTokens())],
    'avg',
  );

export const sum = <T extends AnyNumber>(expression: Expression<T, boolean, any>) =>
  new Expression<T, false, 'sum'>(
    [new StringToken(`SUM`), new GroupToken(expression.toTokens())],
    'sum',
  );

export const xmlagg = <DataType>(expression: Expression<DataType, boolean, any>) =>
  new Expression<number, false, 'xmlagg'>(
    [new StringToken(`xmlagg`), new GroupToken(expression.toTokens())],
    'xmlagg',
  );

// Window functions (https://www.postgresql.org/docs/current/functions-window.html). These are
// only valid with an OVER clause, e.g. `rowNumber().over({ partitionBy: [...], orderBy: [...] })`.
// Aggregates such as sum() and count() can also be used as window functions via `.over()`.

const windowFunction = <DataType, IsNotNull extends boolean, Name extends string>(
  sqlName: string,
  name: Name,
  args: Token[][] = [],
) =>
  new Expression<DataType, IsNotNull, Name>(
    [
      new StringToken(sqlName),
      args.length > 0
        ? new GroupToken([
            new SeparatorToken(
              ',',
              args.map((tokens) => new CollectionToken(tokens)),
            ),
          ])
        : new StringToken(`()`),
    ],
    name,
  );

const valueTokens = (value: any): Token[] =>
  value instanceof Expression ? value.toTokens(false) : [new ParameterToken(value)];

export const rowNumber = () => windowFunction<Int8, true, 'rowNumber'>(`row_number`, 'rowNumber');

export const rank = () => windowFunction<Int8, true, 'rank'>(`rank`, 'rank');

export const denseRank = () => windowFunction<Int8, true, 'denseRank'>(`dense_rank`, 'denseRank');

export const percentRank = () =>
  windowFunction<Float8, true, 'percentRank'>(`percent_rank`, 'percentRank');

export const cumeDist = () => windowFunction<Float8, true, 'cumeDist'>(`cume_dist`, 'cumeDist');

export const ntile = (buckets: number | Expression<Int4, boolean, any>) =>
  windowFunction<Int4, true, 'ntile'>(`ntile`, 'ntile', [valueTokens(buckets)]);

type OffsetFunction<Name extends string> = {
  <DataType>(
    expression: Expression<DataType, boolean, any>,
    offset?: number,
  ): Expression<DataType, false, Name>;
  // With a non-null default, the result is only null when the value itself can be null.
  <DataType, IsNotNull extends boolean>(
    expression: Expression<DataType, IsNotNull, any>,
    offset: number,
    defaultValue: DataType | Expression<DataType, true, any>,
  ): Expression<DataType, IsNotNull, Name>;
};

const offsetFunction =
  <Name extends string>(sqlName: string, name: Name): OffsetFunction<Name> =>
  (expression: Expression<any, boolean, any>, offset?: number, ...rest: any[]) => {
    const args = [expression.toTokens(false)];
    if (offset !== undefined || rest.length > 0) {
      args.push([new ParameterToken(offset ?? 1)]);
    }
    if (rest.length > 0) {
      args.push(valueTokens(rest[0]));
    }
    return windowFunction(sqlName, name, args) as any;
  };

export const lag = offsetFunction(`lag`, 'lag');

export const lead = offsetFunction(`lead`, 'lead');

export const firstValue = <DataType>(expression: Expression<DataType, boolean, any>) =>
  windowFunction<DataType, false, 'firstValue'>(`first_value`, 'firstValue', [
    expression.toTokens(false),
  ]);

export const lastValue = <DataType>(expression: Expression<DataType, boolean, any>) =>
  windowFunction<DataType, false, 'lastValue'>(`last_value`, 'lastValue', [
    expression.toTokens(false),
  ]);

// first_value, last_value and nth_value are nullable because the window frame can be empty (e.g.
// `ROWS BETWEEN 2 PRECEDING AND 1 PRECEDING` on the first row) or shorter than n rows.
export const nthValue = <DataType>(expression: Expression<DataType, boolean, any>, n: number) =>
  windowFunction<DataType, false, 'nthValue'>(`nth_value`, 'nthValue', [
    expression.toTokens(false),
    [new ParameterToken(n)],
  ]);

export const not = (expression: Expression<boolean, boolean, string>) =>
  new DefaultExpression<boolean>([new StringToken(`NOT`), new GroupToken(expression.toTokens())]);

export const and = (expression: Expression<boolean, boolean, string>) =>
  new DefaultExpression<boolean>([new StringToken(`AND`), new GroupToken(expression.toTokens())]);

export const or = (expression: Expression<boolean, boolean, string>) =>
  new DefaultExpression<boolean>([new StringToken(`OR`), new GroupToken(expression.toTokens())]);

export const group = (expression: Expression<boolean, boolean, string>) =>
  new DefaultExpression<boolean>([new GroupToken(expression.toTokens())]);

export const any = <T>(array: Array<T> | Expression<Array<T>, true, any>) =>
  new Expression<T, true, '?column?'>(
    [
      new StringToken(`ANY`),
      new GroupToken(isTokenable(array) ? array.toTokens() : [new ParameterToken(array)]),
    ],
    '?column?',
  );

export const now = () => new Expression<Date, true, 'now'>([new StringToken(`NOW()`)], 'now');

export const exists = (
  expression: Expression<any, any, any> | Query<any>,
): DefaultExpression<boolean> =>
  new DefaultExpression([new StringToken(`EXISTS`), new GroupToken(expression.toTokens())]);

export const andNotExists = (
  expression: Expression<any, any, any> | Query<any>,
): DefaultExpression<boolean> =>
  new DefaultExpression([new StringToken(`AND NOT EXISTS`), new GroupToken(expression.toTokens())]);

export const andExists = (
  expression: Expression<any, any, any> | Query<any>,
): DefaultExpression<boolean> =>
  new DefaultExpression([new StringToken(`AND EXISTS`), new GroupToken(expression.toTokens())]);

export const notExists = (
  expression: Expression<any, any, any> | Query<any>,
): DefaultExpression<boolean> =>
  new DefaultExpression([new StringToken(`NOT EXISTS`), new GroupToken(expression.toTokens())]);

export const coalesce = <DataType>(
  ...expressions: (Expression<DataType, boolean, any> | DataType)[]
) => {
  return new Expression<DataType, true, 'coalesce'>(
    [
      new StringToken(`coalesce`),
      new GroupToken([
        new SeparatorToken(
          ',',
          expressions.map((expression) =>
            expression instanceof Expression
              ? new CollectionToken(expression.toTokens())
              : new ParameterToken(expression),
          ),
        ),
      ]),
    ],
    'coalesce',
  );
};

export function toSql(query: Query<any> | Tokenable) {
  const queryState = createQueryState(query.toTokens());

  return {
    text: queryState.text.join(` `),
    parameters: queryState.parameters,
  };
}
