import { Column } from './column';
import { DefaultExpression, Expression } from './expression';
import { Index } from './table-index';
import { Token } from './tokens';

export type Table<TableName, Columns, Indexes> = Columns & InternalTable<TableName, Columns, Indexes>;

export interface InternalTable<TableName, Columns, Indexes> {
  /** @internal */
  _tableBrand: any;

  /** @internal */
  getName(): string;

  /** @internal */
  getOriginalName(): string | undefined;

  /** @internal */
  toTokens(): Array<Token>;

  // Because we use the column's table name to determine whether the data type should be nullable
  // when joining, we change the column's table name to the alias.
  as<T extends string>(
    alias: T,
  ): Table<
    T,
    {
      [K in keyof Columns]: Columns[K] extends Column<
        infer Name,
        string,
        infer DataType,
        infer IsNotNull,
        infer HasDefault,
        infer JoinType
      >
        ? Column<Name, T, DataType, IsNotNull, HasDefault, JoinType>
        : never;
    },
    Indexes
  >;

  getIndexes(): {
    [K in keyof Indexes]: Indexes[K] extends Index<
      infer Name,
      TableName extends string ? TableName : never,
      infer IsPrimaryKey,
      infer IsUniqueKey
    >
      ? Index<Name, TableName extends string ? TableName : never, IsPrimaryKey, IsUniqueKey>
      : never;
  },
}
