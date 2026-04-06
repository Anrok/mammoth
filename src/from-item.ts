import { StringToken, TableToken, Token } from './tokens';
import { GetDataType } from './types';

import { Expression } from './expression';
import { Query } from './query';
import { CapturingResultSet } from './result-set';
import { wrapQuotes } from './naming';

// A column reference of the form "alias"."key" from a subquery or CTE.
// RelationName carries the relation alias so AddLeftJoin can identify which
// columns to make nullable.
export class SubqueryColumn<
  ColumnName extends string,
  RelationName extends string,
  DataType,
  IsNotNull extends boolean,
> extends Expression<DataType, IsNotNull, ColumnName> {
  // Carries RelationName so conditional types in AddLeftJoin can infer it.
  private _subqueryColumnBrand!: RelationName;

  constructor(
    private readonly subqueryAlias: string,
    private readonly originalKey: string,
    columnAlias?: ColumnName,
  ) {
    super(
      [new StringToken(`${wrapQuotes(subqueryAlias)}.${wrapQuotes(originalKey)}`)],
      (columnAlias ?? originalKey) as ColumnName,
      columnAlias !== undefined,
    );
  }

  as<NewName extends string>(name: NewName): SubqueryColumn<NewName, RelationName, DataType, IsNotNull> {
    return new SubqueryColumn(
      this.subqueryAlias,
      this.originalKey,
      name,
    ) as unknown as SubqueryColumn<NewName, RelationName, DataType, IsNotNull>;
  }
}

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
    ? SubqueryColumn<K extends string ? K : never, CapturedName<Name>, DataType, IsNotNull>
    : never;
};

export const makeFromItem = <Q extends Query<any>, Name extends string = string>(
  name: Name,
  query: Q,
): FromItem<Q, Name> => {
  const fromItem = {
    ...query.getReturningKeys().reduce((fromItem, key) => {
      fromItem[key] = new SubqueryColumn(name, key);
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
