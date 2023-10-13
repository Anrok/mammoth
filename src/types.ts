export type ResultType = 'ROWS' | 'AFFECTED_COUNT';

export type PickByValue<T, ValueType> = Pick<
  T,
  {
    [Key in keyof T]-?: T[Key] extends ValueType ? Key : never;
  }[keyof T]
>;

/**
 * This is a utility type to force the compiler to distribute union types and evalauate the "true"
 * branch of conditionals.  This makes it easier to see the resulting data types from a query
 * in an IDE.
 */
export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

export type GetReturning<TableColumns, ColumnName extends keyof TableColumns> = {
  [K in ColumnName]: TableColumns[K];
};

export class GetDataType<Type, IsNotNull extends boolean> {
  private _!: Type & IsNotNull;
}

/**
 * Type alias for the resulting data type of a nullable expression.
 */
export type DbNull = null;

export type QueryExecutorFn = (
  query: string,
  parameters: any[],
) => Promise<{ rows: any[]; affectedCount: number }>;
