// This is used so we can capture the Returning of every different query type without having to
// specify every query seperately. The private property is used to simulate a nominal type so only
import { ResultSet } from './result-set';
import { Token } from './tokens';
import { DbNull, QueryExecutorFn } from './types';

export type SpecificQuery<DataType, Q extends Query<any>, Result = ResultSet<Q>> = Result extends {
  [K in keyof Result]: DataType | DbNull;
}
  ? Q
  : never;

export type BooleanQuery<Q extends Query<any>> = SpecificQuery<boolean, Q>;

// this class is captured when doing a conditional type check (through T extends Query<infer Returning>).
export abstract class Query<Returning> {
  private _queryBrand!: ['query', Returning];
  protected constructor(
    protected readonly queryExecutor: QueryExecutorFn,
    protected readonly commentTokens: Token[],
  ) {}
  /** @internal */
  toTokens(includeAlias?: boolean): Token[] {
    return [...this.commentTokens, ...this.toQueryTokens(includeAlias)];
  }
  abstract toQueryTokens(includeAlias?: boolean): Token[];
  /** @internal */
  abstract getReturningKeys(): string[];

  abstract newQueryWithTokens(tokens: Token[]): Query<Returning>;

  // Each subclass has a different return type (e.g. ResultSet[], number, conditional types),
  // so we can't use Returning here — it represents the row shape, not the resolved promise type.
  abstract execute(): Promise<unknown>;
}
