import { StringToken, TableToken, Token } from './tokens';
import { GetDataType } from './types';

import { Expression } from './expression';
import { Query } from './query';
import { CapturingResultSet } from './result-set';
import { wrapQuotes } from './naming';

export type FromItem<Q> =
  Q extends Query<any>
    ? FromItemQuery<Q>
    : Q extends (args: any) => infer R
      ? R extends Query<any>
        ? FromItemQuery<R>
        : never
      : never;

type FromItemQuery<Q, Result = Q extends Query<any> ? CapturingResultSet<Q> : never> = {
  toTokens: () => Array<Token>;
} & {
  [K in keyof Result]: Result[K] extends GetDataType<infer DataType, infer IsNotNull>
    ? Expression<DataType, IsNotNull, K extends string ? K : never>
    : never;
};

export const makeFromItem = <Q extends Query<any>>(name: string, query: Q): FromItem<Q> => {
  const fromItem = {
    ...query.getReturningKeys().reduce((fromItem, key) => {
      fromItem[key] = new Expression(
        [new StringToken(`${wrapQuotes(name)}.${wrapQuotes(key)}`)],
        key,
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
