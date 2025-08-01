import {
  CollectionToken,
  ParameterToken,
  SeparatorToken,
  StringToken,
  Token,
  createQueryState,
} from './tokens';
import { DbNull, GetReturning, QueryExecutorFn, ResultType } from './types';

import { Column } from './column';
import { Expression } from './expression';
import { Query } from './query';
import { ResultSet } from './result-set';
import { Table } from './TableType';
import { wrapQuotes } from './naming';
import { FromItem } from './with';
import { isTokenable } from './sql-functions';
import assert from 'assert';

// https://www.postgresql.org/docs/12/sql-update.html
export class UpdateQuery<
  T extends Table<any, any>,
  Returning = number,
  TableColumns = T extends Table<any, infer Columns> ? Columns : never,
> extends Query<Returning> {
  private _updateQueryBrand: any;

  /** @internal */
  getReturningKeys() {
    return this.returningKeys;
  }

  /** @internal */
  newQueryWithTokens(tokens: Array<Token>): UpdateQuery<T, Returning, TableColumns> {
    return new UpdateQuery(
      this.queryExecutor,
      this.commentTokens,
      this.returningKeys,
      this.table,
      this.resultType,
      tokens,
    );
  }

  constructor(
    queryExecutor: QueryExecutorFn,
    commentTokens: Token[],
    private readonly returningKeys: string[],
    private readonly table: T,
    private readonly resultType: ResultType,
    private readonly tokens: Token[],
  ) {
    super(queryExecutor, commentTokens);
  }

  then<Result1, Result2 = never>(
    onFulfilled?:
      | ((
          value: Returning extends number ? Returning : ResultSet<UpdateQuery<T, Returning>>[],
        ) => Result1 | PromiseLike<Result1>)
      | undefined
      | null,
    onRejected?: ((reason: any) => Result2 | PromiseLike<Result2>) | undefined | null,
  ): Promise<Result1 | Result2> {
    const queryState = createQueryState(this.toTokens());

    return this.queryExecutor(queryState.text.join(` `), queryState.parameters)
      .then((result) =>
        onFulfilled
          ? onFulfilled(
              this.resultType === `AFFECTED_COUNT` ? result.affectedCount : (result.rows as any),
            )
          : (result as any),
      )
      .catch(onRejected);
  }

  where(condition: Expression<boolean, boolean, string>): UpdateQuery<T, Returning> {
    return this.newQueryWithTokens([
      ...this.tokens,
      new StringToken(`WHERE`),
      ...condition.toTokens(),
    ]);
  }

  whereCurrentOf(cursorName: string) {
    return this.newQueryWithTokens([
      ...this.tokens,
      new StringToken(`WHERE CURRENT OF`),
      new ParameterToken(cursorName),
    ]);
  }

  from(fromItem: FromItem<any> | Table<string, unknown>): UpdateQuery<T, Returning> {
    return this.newQueryWithTokens([
      ...this.tokens,
      new StringToken(`FROM`),
      ...fromItem.toTokens(),
    ]);
  }

  returning<C1 extends keyof TableColumns>(
    column1: C1,
  ): UpdateQuery<T, GetReturning<TableColumns, C1>>;
  returning<C1 extends keyof TableColumns, C2 extends keyof TableColumns>(
    column1: C1,
    column2: C2,
  ): UpdateQuery<T, GetReturning<TableColumns, C1> & GetReturning<TableColumns, C2>>;
  returning<
    C1 extends keyof TableColumns,
    C2 extends keyof TableColumns,
    C3 extends keyof TableColumns,
  >(
    column1: C1,
    column2: C2,
    column3: C3,
  ): UpdateQuery<
    T,
    GetReturning<TableColumns, C1> & GetReturning<TableColumns, C2> & GetReturning<TableColumns, C3>
  >;
  returning<
    C1 extends keyof TableColumns,
    C2 extends keyof TableColumns,
    C3 extends keyof TableColumns,
    C4 extends keyof TableColumns,
  >(
    column1: C1,
    column2: C2,
    column3: C3,
    column4: C4,
  ): UpdateQuery<
    T,
    GetReturning<TableColumns, C1> &
      GetReturning<TableColumns, C2> &
      GetReturning<TableColumns, C3> &
      GetReturning<TableColumns, C4>
  >;
  returning<
    C1 extends keyof TableColumns,
    C2 extends keyof TableColumns,
    C3 extends keyof TableColumns,
    C4 extends keyof TableColumns,
    C5 extends keyof TableColumns,
  >(
    column1: C1,
    column2: C2,
    column3: C3,
    column4: C4,
    column5: C5,
  ): UpdateQuery<
    T,
    GetReturning<TableColumns, C1> &
      GetReturning<TableColumns, C2> &
      GetReturning<TableColumns, C3> &
      GetReturning<TableColumns, C4> &
      GetReturning<TableColumns, C5>
  >;
  returning<
    C1 extends keyof TableColumns,
    C2 extends keyof TableColumns,
    C3 extends keyof TableColumns,
    C4 extends keyof TableColumns,
    C5 extends keyof TableColumns,
    C6 extends keyof TableColumns,
  >(
    column1: C1,
    column2: C2,
    column3: C3,
    column4: C4,
    column5: C5,
    column6: C6,
  ): UpdateQuery<
    T,
    GetReturning<TableColumns, C1> &
      GetReturning<TableColumns, C2> &
      GetReturning<TableColumns, C3> &
      GetReturning<TableColumns, C4> &
      GetReturning<TableColumns, C5> &
      GetReturning<TableColumns, C6>
  >;
  returning<
    C1 extends keyof TableColumns,
    C2 extends keyof TableColumns,
    C3 extends keyof TableColumns,
    C4 extends keyof TableColumns,
    C5 extends keyof TableColumns,
    C6 extends keyof TableColumns,
    C7 extends keyof TableColumns,
  >(
    column1: C1,
    column2: C2,
    column3: C3,
    column4: C4,
    column5: C5,
    column6: C6,
    column7: C7,
  ): UpdateQuery<
    T,
    GetReturning<TableColumns, C1> &
      GetReturning<TableColumns, C2> &
      GetReturning<TableColumns, C3> &
      GetReturning<TableColumns, C4> &
      GetReturning<TableColumns, C5> &
      GetReturning<TableColumns, C6> &
      GetReturning<TableColumns, C7>
  >;
  returning<
    C1 extends keyof TableColumns,
    C2 extends keyof TableColumns,
    C3 extends keyof TableColumns,
    C4 extends keyof TableColumns,
    C5 extends keyof TableColumns,
    C6 extends keyof TableColumns,
    C7 extends keyof TableColumns,
    C8 extends keyof TableColumns,
  >(
    column1: C1,
    column2: C2,
    column3: C3,
    column4: C4,
    column5: C5,
    column6: C6,
    column7: C7,
    column8: C8,
  ): UpdateQuery<
    T,
    GetReturning<TableColumns, C1> &
      GetReturning<TableColumns, C2> &
      GetReturning<TableColumns, C3> &
      GetReturning<TableColumns, C4> &
      GetReturning<TableColumns, C5> &
      GetReturning<TableColumns, C6> &
      GetReturning<TableColumns, C7> &
      GetReturning<TableColumns, C8>
  >;
  returning<
    C1 extends keyof TableColumns,
    C2 extends keyof TableColumns,
    C3 extends keyof TableColumns,
    C4 extends keyof TableColumns,
    C5 extends keyof TableColumns,
    C6 extends keyof TableColumns,
    C7 extends keyof TableColumns,
    C8 extends keyof TableColumns,
    C9 extends keyof TableColumns,
  >(
    column1: C1,
    column2: C2,
    column3: C3,
    column4: C4,
    column5: C5,
    column6: C6,
    column7: C7,
    column8: C8,
    column9: C9,
  ): UpdateQuery<
    T,
    GetReturning<TableColumns, C1> &
      GetReturning<TableColumns, C2> &
      GetReturning<TableColumns, C3> &
      GetReturning<TableColumns, C4> &
      GetReturning<TableColumns, C5> &
      GetReturning<TableColumns, C6> &
      GetReturning<TableColumns, C7> &
      GetReturning<TableColumns, C8> &
      GetReturning<TableColumns, C9>
  >;
  returning<
    C1 extends keyof TableColumns,
    C2 extends keyof TableColumns,
    C3 extends keyof TableColumns,
    C4 extends keyof TableColumns,
    C5 extends keyof TableColumns,
    C6 extends keyof TableColumns,
    C7 extends keyof TableColumns,
    C8 extends keyof TableColumns,
    C9 extends keyof TableColumns,
    C10 extends keyof TableColumns,
  >(
    column1: C1,
    column2: C2,
    column3: C3,
    column4: C4,
    column5: C5,
    column6: C6,
    column7: C7,
    column8: C8,
    column9: C9,
    column10: C10,
  ): UpdateQuery<
    T,
    GetReturning<TableColumns, C1> &
      GetReturning<TableColumns, C2> &
      GetReturning<TableColumns, C3> &
      GetReturning<TableColumns, C4> &
      GetReturning<TableColumns, C5> &
      GetReturning<TableColumns, C6> &
      GetReturning<TableColumns, C7> &
      GetReturning<TableColumns, C8> &
      GetReturning<TableColumns, C9> &
      GetReturning<TableColumns, C10>
  >;
  returning(...columnNames: any[]) {
    return new UpdateQuery(
      this.queryExecutor,
      this.commentTokens,
      columnNames,
      this.table,
      'ROWS',
      [
        ...this.tokens,
        new StringToken(`RETURNING`),
        new SeparatorToken(
          `,`,
          columnNames.map((alias) => {
            const column = (this.table as any)[alias] as Column<any, any, any, any, any, any>;

            if (alias !== column.getSnakeCaseName()) {
              return new StringToken(
                `${wrapQuotes(column.getSnakeCaseName())} ${wrapQuotes(alias)}`,
              );
            } else {
              return new StringToken(wrapQuotes(column.getSnakeCaseName()));
            }
          }),
        ),
      ],
    ) as any;
  }

  /** @internal */
  toQueryTokens() {
    return this.tokens;
  }
}

export const makeUpdate =
  (queryExecutor: QueryExecutorFn, commentTokens: Token[]) =>
  <T extends Table<string, unknown>>(table: T) => {
    return {
      set(
        values: T extends Table<any, infer Columns>
          ? {
              [K in keyof Columns]?: Columns[K] extends Column<
                any,
                any,
                infer DataType,
                infer IsNotNull,
                any,
                any
              >
                ? IsNotNull extends true
                  ? DataType | Expression<DataType, boolean, any>
                  : DataType | DbNull | Expression<DataType | DbNull, boolean, any>
                : never;
            }
          : never,
      ): UpdateQuery<T, number> {
        const valuesToken = [];
        for (const key of Object.keys(values)) {
          const value = (values as any)[key];
          if (value === undefined) continue;

          const column = (table as any)[key] as Column<any, any, any, any, any, any>;

          valuesToken.push(
            new CollectionToken([
              new StringToken(column.getSnakeCaseName()),
              new StringToken(`=`),
              ...(isTokenable(value) ? value.toTokens() : [new ParameterToken(value)]),
            ]),
          );
        }

        assert(valuesToken.length > 0, `SET must be setting at least one value.`);

        return new UpdateQuery(queryExecutor, commentTokens, [], table, 'AFFECTED_COUNT', [
          new StringToken(`UPDATE`),
          ...table.toTokens(),
          new StringToken(`SET`),
          new SeparatorToken(`,`, valuesToken),
        ]);
      },
    };
  };
