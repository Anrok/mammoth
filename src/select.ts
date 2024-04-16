import {
  CollectionToken,
  GroupToken,
  ParameterToken,
  SeparatorToken,
  StringToken,
  Token,
  createQueryState,
} from './tokens';
import { SelectFn, Selectable } from './SelectFn';

import { Column } from './column';
import { Expression } from './expression';
import { FromItem } from './with';
import { Query } from './query';
import { QueryExecutorFn } from './types';
import { ResultSet } from './result-set';
import { Star } from './sql-functions';
import { Table } from './TableType';
import { TableDefinition } from './table';

export { SelectFn };

type JoinType = 'left-join' | 'left-side-of-right-join' | 'full-join';
type ToJoinType<OldType, NewType extends JoinType> =
  Extract<OldType, 'left-side-of-right-join'> extends never ? NewType : OldType;

// It's important to note that to make sure we infer the table name, we should pass object instead
// of any as the second argument to the table.
type GetTableName<T extends Table<any, any>> = T extends Table<infer A, object> ? A : never;

type FromItemOrTable = FromItem<any> | Table<string, unknown>;

type AddLeftJoin<Columns, JoinTable> = {
  [K in keyof Columns]: Columns[K] extends Column<
    infer Name,
    infer TableName,
    infer DataType,
    infer IsNotNull,
    infer HasDefault,
    infer JoinType
  >
    ? Extract<GetTableName<JoinTable>, TableName> extends never
      ? Column<Name, TableName, DataType, IsNotNull, HasDefault, JoinType>
      : Column<Name, TableName, DataType, IsNotNull, HasDefault, ToJoinType<JoinType, 'left-join'>>
    : never;
};

type AddRightJoin<Columns, JoinTable> = {
  [K in keyof Columns]: Columns[K] extends Column<
    infer Name,
    infer TableName,
    infer DataType,
    infer IsNotNull,
    infer HasDefault,
    infer JoinType
  >
    ? Extract<GetTableName<JoinTable>, TableName> extends never
      ? Column<
          Name,
          TableName,
          DataType,
          IsNotNull,
          HasDefault,
          ToJoinType<JoinType, 'left-side-of-right-join'>
        >
      : Columns[K]
    : never;
};

type AddJoinType<Columns, NewJoinType extends JoinType> = {
  [K in keyof Columns]: Columns[K] extends Column<
    infer Name,
    infer TableName,
    infer DataType,
    infer IsNotNull,
    infer HasDefault,
    infer OldJoinType
  >
    ? Column<Name, TableName, DataType, IsNotNull, HasDefault, ToJoinType<OldJoinType, NewJoinType>>
    : never;
};

type Join<Query extends SelectQuery<any, boolean>, JoinTable extends FromItemOrTable> =
  Query extends SelectQuery<infer ExistingColumns, infer IncludesStar>
    ? IncludesStar extends true
      ? SelectQuery<ExistingColumns & Omit<GetColumns<JoinTable>, keyof ExistingColumns>, true>
      : SelectQuery<ExistingColumns, false>
    : never;

type GetColumns<From extends FromItemOrTable> =
  From extends Table<any, infer Columns>
    ? Columns
    : From extends FromItem<infer Q>
      ? Q extends Query<infer Returning>
        ? Returning
        : never
      : never;

type LeftJoin<Query extends SelectQuery<any, boolean>, JoinTable extends FromItemOrTable> =
  Query extends SelectQuery<infer ExistingColumns, infer IncludesStar>
    ? IncludesStar extends true
      ? SelectQuery<ExistingColumns & AddJoinType<GetColumns<JoinTable>, 'left-join'>>
      : SelectQuery<AddLeftJoin<ExistingColumns, JoinTable>>
    : never;

type RightJoin<Query extends SelectQuery<any, boolean>, JoinTable extends FromItemOrTable> =
  Query extends SelectQuery<infer ExistingColumns, infer IncludesStar>
    ? IncludesStar extends true
      ? SelectQuery<AddJoinType<ExistingColumns, 'left-side-of-right-join'> & GetColumns<JoinTable>>
      : SelectQuery<AddRightJoin<ExistingColumns, JoinTable>>
    : never;

type FullJoin<Query extends SelectQuery<any, boolean>, JoinTable extends FromItemOrTable> =
  Query extends SelectQuery<infer ExistingColumns, infer IncludesStar>
    ? IncludesStar extends true
      ? SelectQuery<AddJoinType<ExistingColumns & GetColumns<JoinTable>, 'full-join'>>
      : SelectQuery<AddJoinType<ExistingColumns, 'full-join'>>
    : never;

// https://www.postgresql.org/docs/12/sql-select.html
export class SelectQuery<
  Columns extends { [column: string]: any },
  IncludesStar extends boolean = false,
> extends Query<Columns> {
  private _selectQueryBrand: any;

  /** @internal */
  getReturningKeys() {
    return this.returningKeys;
  }

  /** @internal */
  newQueryWithTokens(tokens: Token[]): SelectQuery<Columns> {
    return this.newSelectQuery(tokens);
  }

  constructor(
    private readonly queryExecutor: QueryExecutorFn,
    private readonly returningKeys: string[],
    private readonly includesStar: boolean,
    private readonly tokens: Token[],
  ) {
    super();
  }

  then<Result1, Result2 = never>(
    onFulfilled?:
      | ((value: ResultSet<SelectQuery<Columns>>[]) => Result1 | PromiseLike<Result1>)
      | undefined
      | null,
    onRejected?: ((reason: any) => Result2 | PromiseLike<Result2>) | undefined | null,
  ): Promise<Result1 | Result2> {
    const queryState = createQueryState(this.tokens);

    return this.queryExecutor(queryState.text.join(` `), queryState.parameters)
      .then((result) => (onFulfilled ? onFulfilled(result.rows as any) : result))
      .catch(onRejected) as any;
  }

  private newSelectQuery(tokens: Token[], table?: Table<any, any>): SelectQuery<Columns> {
    const returningKeys =
      this.includesStar && table
        ? [
            ...this.returningKeys,
            ...Object.keys(table).filter(
              (name) => ![`as`, `getName`, `getOriginalName`, `toTokens`].includes(name),
            ),
          ]
        : this.returningKeys;

    return new SelectQuery(this.queryExecutor, returningKeys, this.includesStar, tokens);
  }

  // [ FROM from_item [, ...] ]
  from<T extends FromItemOrTable>(
    fromItem: T,
  ): T extends TableDefinition<any> ? never : Join<SelectQuery<Columns, IncludesStar>, T> {
    return this.newSelectQuery(
      [...this.tokens, new StringToken(`FROM`), ...fromItem.toTokens()],
      fromItem,
    ) as any;
  }

  join<T extends FromItemOrTable>(table: T): Join<SelectQuery<Columns, IncludesStar>, T> {
    return this.newSelectQuery(
      [...this.tokens, new StringToken(`JOIN`), ...table.toTokens()],
      table,
    ) as any;
  }

  innerJoin<JoinTable extends FromItemOrTable>(
    table: JoinTable,
  ): Join<SelectQuery<Columns, IncludesStar>, JoinTable> {
    return this.newSelectQuery(
      [...this.tokens, new StringToken(`INNER JOIN`), ...table.toTokens()],
      table,
    ) as any;
  }

  leftOuterJoin<JoinTable extends FromItemOrTable>(
    table: JoinTable,
  ): LeftJoin<SelectQuery<Columns, IncludesStar>, JoinTable> {
    return this.newSelectQuery(
      [...this.tokens, new StringToken(`LEFT OUTER JOIN`), ...table.toTokens()],
      table,
    ) as any;
  }

  leftJoin<JoinTable extends FromItemOrTable>(
    table: JoinTable,
  ): LeftJoin<SelectQuery<Columns, IncludesStar>, JoinTable> {
    return this.newSelectQuery(
      [...this.tokens, new StringToken(`LEFT JOIN`), ...table.toTokens()],
      table,
    ) as any;
  }

  rightOuterJoin<JoinTable extends FromItemOrTable>(
    table: JoinTable,
  ): RightJoin<SelectQuery<Columns, IncludesStar>, JoinTable> {
    return this.newSelectQuery(
      [...this.tokens, new StringToken(`RIGHT OUTER JOIN`), ...table.toTokens()],
      table,
    ) as any;
  }

  rightJoin<JoinTable extends FromItemOrTable>(
    table: JoinTable,
  ): RightJoin<SelectQuery<Columns, IncludesStar>, JoinTable> {
    return this.newSelectQuery(
      [...this.tokens, new StringToken(`RIGHT JOIN`), ...table.toTokens()],
      table,
    ) as any;
  }

  fullOuterJoin<JoinTable extends FromItemOrTable>(
    table: JoinTable,
  ): FullJoin<SelectQuery<Columns, IncludesStar>, JoinTable> {
    return this.newSelectQuery(
      [...this.tokens, new StringToken(`FULL OUTER JOIN`), ...table.toTokens()],
      table,
    ) as any;
  }

  fullJoin<JoinTable extends FromItemOrTable>(
    table: JoinTable,
  ): FullJoin<SelectQuery<Columns, IncludesStar>, JoinTable> {
    return this.newSelectQuery(
      [...this.tokens, new StringToken(`FULL JOIN`), ...table.toTokens()],
      table,
    ) as any;
  }

  // This doesn't go with an ON or USING afterwards
  crossJoin<JoinTable extends FromItemOrTable>(
    table: FromItemOrTable,
  ): Join<SelectQuery<Columns, IncludesStar>, JoinTable> {
    return this.newSelectQuery(
      [...this.tokens, new StringToken(`CROSS JOIN`), ...table.toTokens()],
      table,
    ) as any;
  }

  forUpdate(): SelectQuery<Columns> {
    return this.newSelectQuery([...this.tokens, new StringToken(`FOR UPDATE`)]);
  }

  forNoKeyUpdate(): SelectQuery<Columns> {
    return this.newSelectQuery([...this.tokens, new StringToken(`FOR NO KEY UPDATE`)]);
  }

  forShare(): SelectQuery<Columns> {
    return this.newSelectQuery([...this.tokens, new StringToken(`FOR SHARE`)]);
  }

  forKeyShare(): SelectQuery<Columns> {
    return this.newSelectQuery([...this.tokens, new StringToken(`FOR KEY SHARE`)]);
  }

  /** @internal */
  toTokens() {
    return this.tokens;
  }

  on(joinCondition: Expression<boolean, boolean, string>): SelectQuery<Columns, IncludesStar> {
    return this.newSelectQuery([
      ...this.tokens,
      new StringToken(`ON`),
      new GroupToken(joinCondition.toTokens()),
    ]) as any;
  }

  using(...columns: Column<any, any, any, any, any, any>[]): SelectQuery<Columns> {
    return this.newSelectQuery([
      ...this.tokens,
      new StringToken(`USING`),
      new GroupToken([
        new SeparatorToken(
          ',',
          columns.map((column) => new CollectionToken(column.toTokens())),
        ),
      ]),
    ]);
  }

  // [ WHERE condition ]
  where(condition: Expression<boolean, boolean, string>): SelectQuery<Columns> {
    return this.newSelectQuery([...this.tokens, new StringToken(`WHERE`), ...condition.toTokens()]);
  }

  // [ GROUP BY grouping_element [, ...] ]
  // ( )
  // expression
  // ( expression [, ...] )
  // ROLLUP ( { expression | ( expression [, ...] ) } [, ...] )
  // CUBE ( { expression | ( expression [, ...] ) } [, ...] )
  // GROUPING SETS ( grouping_element [, ...] )
  groupBy(...expressions: Expression<any, any, any>[]): SelectQuery<Columns> {
    return this.newSelectQuery([
      ...this.tokens,
      new StringToken(`GROUP BY`),
      new SeparatorToken(
        ',',
        expressions.map((expression) => new CollectionToken(expression.toTokens())),
      ),
    ]);
  }

  // [ HAVING condition [, ...] ]
  having(...conditions: Expression<boolean, boolean, string>[]): SelectQuery<Columns> {
    return this.newSelectQuery([
      ...this.tokens,
      new StringToken(`HAVING`),
      new SeparatorToken(
        `,`,
        conditions.map((condition) => new CollectionToken(condition.toTokens())),
      ),
    ]);
  }

  // [ WINDOW window_name AS ( window_definition ) [, ...] ]
  window(): SelectQuery<Columns> {
    return undefined as any;
  }

  // [ { UNION | INTERSECT | EXCEPT } [ ALL | DISTINCT ] select ]
  // [ ORDER BY expression [ ASC | DESC | USING operator ] [ NULLS { FIRST | LAST } ] [, ...] ]
  orderBy(...expressions: Expression<any, any, any>[]): SelectQuery<Columns> {
    return this.newSelectQuery([
      ...this.tokens,
      new StringToken(`ORDER BY`),
      new SeparatorToken(
        ',',
        expressions.map((expression) => new CollectionToken(expression.toTokens())),
      ),
    ]);
  }

  // [ LIMIT { count | ALL } ]
  limit(limit: number | 'ALL'): SelectQuery<Columns> {
    if (limit === `ALL`) {
      return this.newSelectQuery([...this.tokens, new StringToken(`LIMIT ALL`)]);
    } else {
      return this.newSelectQuery([
        ...this.tokens,
        new StringToken(`LIMIT`),
        new ParameterToken(limit),
      ]);
    }
  }

  // [ OFFSET start [ ROW | ROWS ] ]
  offset(start: number): SelectQuery<Columns> {
    return this.newSelectQuery([
      ...this.tokens,
      new StringToken(`OFFSET`),
      new ParameterToken(start),
    ]);
  }

  fetch(count: number): SelectQuery<Columns> {
    return this.newSelectQuery([
      ...this.tokens,
      new StringToken(`FETCH FIRST`),
      new ParameterToken(count),
      new StringToken(`ROWS ONLY`),
    ]);
  }

  of(table: Table<any, any>): SelectQuery<Columns> {
    return this.newSelectQuery([
      ...this.tokens,
      new StringToken(`OF`),
      new StringToken(table.getName()),
    ]);
  }

  nowait(): SelectQuery<Columns> {
    return this.newSelectQuery([...this.tokens, new StringToken(`NOWAIT`)]);
  }

  skipLocked(): SelectQuery<Columns> {
    return this.newSelectQuery([...this.tokens, new StringToken(`SKIP LOCKED`)]);
  }
}

export const makeSelect =
  (queryExecutor: QueryExecutorFn, initialTokens?: Token[]): SelectFn =>
  <T extends Selectable>(...columns: T[]) => {
    const includesStar = !!columns.find((column) => column instanceof Star);

    const returningKeys = columns
      .filter((column) => !(column instanceof Star))
      .map((column) => {
        if (column instanceof Query) {
          return column.getReturningKeys()[0];
        }

        if (!column) {
          throw new Error(`Column '${column}' not found in columns '${columns}'`);
        }

        return (column as any).getName();
      });

    return new SelectQuery(queryExecutor, returningKeys, includesStar, [
      ...(initialTokens || []),
      new StringToken(`SELECT`),
      new SeparatorToken(
        `,`,
        columns.map((column) => {
          const tokens = column.toTokens(true);

          if (column instanceof Query) {
            return new GroupToken(tokens);
          }

          return new CollectionToken(tokens);
        }),
      ),
    ]) as any;
  };
