import { StringToken, TableToken, Token } from './tokens';
import { GetDataType } from './types';

import { ColumnExpression } from './column';
import { Query } from './query';
import { CapturingResultSet } from './result-set';
import { wrapQuotes } from './naming';

// Use the literal name when captured; never otherwise (prevents false matches
// when the name isn't known at compile time).
type CapturedName<Name extends string> = string extends Name ? never : Name;

export type FromItem<Q, Name extends string = string> =
  Q extends Query<any>
    ? FromItemQuery<Q, Name>
    : Q extends (args: any) => infer R
      ? R extends Query<any>
        ? FromItemQuery<R, Name>
        : never
      : never;

type FromItemQuery<
  Q,
  Name extends string = string,
  Result = Q extends Query<any> ? CapturingResultSet<Q> : never,
> = {
  toTokens: () => Array<Token>;
} & {
  [K in keyof Result]: Result[K] extends GetDataType<infer DataType, infer IsNotNull>
    ? ColumnExpression<K extends string ? K : never, CapturedName<Name>, DataType, IsNotNull>
    : never;
};

export const makeFromItem = <Q extends Query<any>, Name extends string = string>(
  name: Name,
  query: Q,
): FromItem<Q, Name> => {
  const fromItem = {
    ...query.getReturningKeys().reduce((fromItem, key) => {
      fromItem[key] = new ColumnExpression(
        [new StringToken(`${wrapQuotes(name)}.${wrapQuotes(key)}`)],
        key,
        name,
        undefined,
      );
      return fromItem;
    }, {} as any),

    getName() {
      return name;
    },

    getOriginalName() {
      return undefined;
    },
    toTokens() {
      return [new TableToken(this)];
    },
  };

  return fromItem;
};
