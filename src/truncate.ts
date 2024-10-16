import { QueryExecutorFn, ResultType } from './types';
import { StringToken, Token, createQueryState } from './tokens';

import { Query } from './query';
import { Table } from './TableType';
import { TableDefinition } from './table';

export const makeTruncate =
  (queryExecutor: QueryExecutorFn) =>
  <T extends Table<any, any, any>>(
    table: T,
  ): T extends TableDefinition<any, any> ? never : TruncateQuery<T> => {
    return new TruncateQuery<T>(queryExecutor, table, 'AFFECTED_COUNT', [
      new StringToken(`TRUNCATE`),
      new StringToken((table as Table<any, any, any>).getName()),
    ]) as any;
  };

export class TruncateQuery<
  T extends Table<any, any, any>,
  Returning = number,
  TableColumns = T extends Table<any, infer Columns, any> ? Columns : never,
> extends Query<Returning> {
  /** @internal */
  newQueryWithTokens(tokens: Array<Token>): TruncateQuery<T, Returning, TableColumns> {
    return new TruncateQuery(this.queryExecutor, this.table, this.resultType, tokens);
  }

  constructor(
    private readonly queryExecutor: QueryExecutorFn,
    private readonly table: T,
    private readonly resultType: ResultType,
    private readonly tokens: Token[],
  ) {
    super();
  }

  then<Result1, Result2 = never>(
    onFulfilled?: ((value: number) => Result1 | PromiseLike<Result1>) | undefined | null,
    onRejected?: ((reason: any) => Result2 | PromiseLike<Result2>) | undefined | null,
  ): Promise<Result1 | Result2> {
    const queryState = createQueryState(this.tokens);

    return this.queryExecutor(queryState.text.join(` `), queryState.parameters)
      .then((result) => onFulfilled?.(result.affectedCount))
      .catch(onRejected) as any;
  }

  restartIdentity<T extends Table<any, any, any>>() {
    return this.newQueryWithTokens([...this.tokens, new StringToken(`RESTART IDENTITY`)]) as any;
  }

  continueIdentity<T extends Table<any, any, any>>() {
    return this.newQueryWithTokens([...this.tokens, new StringToken(`CONTINUE IDENTITY`)]) as any;
  }

  cascade<T extends Table<any, any, any>>() {
    return this.newQueryWithTokens([...this.tokens, new StringToken('CASCADE')]);
  }

  restrict<T extends Table<any, any, any>>() {
    return this.newQueryWithTokens([...this.tokens, new StringToken('RESTRICT')]);
  }

  getReturningKeys(): string[] {
    return [];
  }

  toTokens(): Token[] {
    return this.tokens;
  }
}
