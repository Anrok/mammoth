import { Column, ColumnDefinition, ColumnDefinitionsToColumns } from "./column"
import { DefaultExpression, Expression } from "./expression";
import { toSnakeCase, wrapQuotes } from "./naming";
import { GroupToken, SeparatorToken, StringToken, Token } from "./tokens";

export type IndexDefinitionsToIndexes<
  TableNameT extends string,
  IndexDefinitionsT extends { [column: string]: IndexDefinition<boolean, boolean> },
> = {
  [IndexName in keyof IndexDefinitionsT]: IndexName extends string
    ? IndexDefinitionsT[IndexName] extends IndexDefinition<
        infer IsPrimaryKey,
        infer IsUniqueKey
      >
      ? Index<
        IndexName,
        TableNameT,
        IsPrimaryKey,
        IsUniqueKey
      > : never
    : never;
};

export interface IndexDefinitionFormat {
  type: string;
  expressions: Expression<any, boolean, string>[];
  isUniqueKey: boolean;
  isPrimaryKey: boolean;
  include: Column<string, string, any, boolean, boolean, any>[];
  where: DefaultExpression<boolean> | null;
}

export interface IndexDefinition<
  IsPrimaryKey extends boolean = false,
  IsUniqueKey extends boolean = false,
> {
  getDefinition(): IndexDefinitionFormat;
  where(condition: DefaultExpression<boolean>): IndexDefinition<IsPrimaryKey, IsUniqueKey>;
  primaryKey(): IndexDefinition<true, true>;
  unique(): IndexDefinition<IsPrimaryKey, true>;
  include(...columns: Column<string, string, any, boolean, boolean, any>[]): IndexDefinition<IsPrimaryKey, IsUniqueKey>;
}

export class Index<
  Name extends string,
  TableName extends string,
  IsPrimaryKey extends boolean,
  IsUnique extends boolean,
> {
  private _indexBrand: any;

  /** @internal */
  getSnakeCaseName() {
    return wrapQuotes(toSnakeCase(this.indexName));
  }

  /** @internal */
  getName() {
    return this.indexName;
  }

  constructor(
    private readonly indexName: Name,
    private readonly tableName: TableName,
    private readonly indexType: string,
    private readonly isPrimaryKey: IsPrimaryKey,
    private readonly isUniqueKey: IsUnique,
    private readonly expressions: Expression<any, boolean, string>[],
    private readonly include: Column<string, TableName, any, boolean, boolean, any>[],
    private readonly where: DefaultExpression<boolean> | null,
  ) {}

  /** @internal */
  toTokens(): Token[] {
    const snakeCaseIndexName = toSnakeCase(this.indexName as unknown as string);
    // TODO: Change impl from being token-based to string-based
    const tokens: Token[] = [
      this.isUniqueKey ? new StringToken('CREATE UNIQUE INDEX') : new StringToken('CREATE INDEX'),
      new StringToken(snakeCaseIndexName),
      new StringToken('ON'),
      new StringToken(`public.${this.tableName}`),
      new StringToken('USING'),
      new StringToken(this.indexType),
      new GroupToken([
        new SeparatorToken(',',
          this.expressions.map(exp => exp instanceof Column ? exp.toTokens()[0] : new GroupToken(exp.toTokens(), "(", ")"))
        ),
      ], "(", ")"),
    ];

    if (this.include.length > 0) {
      tokens.push(new StringToken('INCLUDE'));
      tokens.push(new GroupToken([
        new SeparatorToken(
            ',',
            this.include.map(column => column.toTokens()).flat(),
        ),
      ], "(", ")"));
    }

    if (this.where !== null) {
      tokens.push(new StringToken('WHERE'));
      tokens.push(new GroupToken(this.where.toTokens(), "(", ")"));
    }
    return tokens;
  }
}

export const makeIndexDefinition = <
    TableName extends string,
    Columns extends { [column: string]: Column<string, TableName, any, boolean, boolean, any> },
>(indexType: string, expressions: Expression<any, boolean, string>[]) => {
  let type = indexType;
  let isUniqueKey = false;
  let isPrimaryKey = false;
  let include: Columns[keyof Columns][] = [];
  let where: DefaultExpression<boolean> | null = null;

  return {
      getDefinition() {
          return {
              type,
              expressions,
              isUniqueKey,
              isPrimaryKey,
              include,
              where,
          };
      },
      where(condition: DefaultExpression<boolean>) {
          where = condition;
          return this as any;
      },
      primaryKey() {
        isPrimaryKey = true;
        isUniqueKey = true;
        return this as any;
      },
      unique() {
        isUniqueKey = true;
        return this as any;
      },
      include(...columns: Columns[keyof Columns][]) {
        include = columns;
        return this as any;
      }
  };
}
