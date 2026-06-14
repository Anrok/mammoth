import { GroupToken, ParameterToken, SeparatorToken, StringToken, Token } from './tokens';
import { toSnakeCase, wrapQuotes } from './naming';

import { Expression } from './expression';
import { TableDefinition } from './table';

export interface ColumnDefinitionFormat {
  dataType: string;
  isNotNull: boolean;
  isPrimaryKey: boolean;
  defaultExpression?: string;
  checkExpression?: string;
  isUnique: boolean;
  referencesTable?: string;
  referencesSelf?: boolean;
  referencesColumn?: string;
  enumValues?: string[];
}

export interface ColumnDefinition<
  DataType,
  IsNotNull extends boolean = false,
  HasDefault extends boolean = false,
> {
  notNull(): ColumnDefinition<DataType, true, HasDefault>;
  primaryKey(): ColumnDefinition<DataType, true, HasDefault>;
  default(expression: string): ColumnDefinition<DataType, IsNotNull, true>;
  // In most cases a default clause means you do not need to provide any value during insert. In
  // theory however it's possible the default expression doesn't set a value in some case. In the
  // case of a NOT NULL constraint this would mean you'd have to set a value when inserting. Because
  // this is not neccesary in most of the cases we just assume a default expression will always set
  // a value. You can opt out of this by setting `IsAlwaysSettingAValue` to false.
  default<IsAlwaysSettingAValue extends boolean>(
    expression: string,
  ): ColumnDefinition<DataType, IsNotNull, IsAlwaysSettingAValue>;
  check(expression: string): ColumnDefinition<DataType, IsNotNull, HasDefault>;
  unique(): ColumnDefinition<DataType, IsNotNull, HasDefault>;
  references<
    T extends TableDefinition<any>,
    ColumnName extends T extends TableDefinition<infer Columns>
      ? keyof Columns extends string
        ? keyof Columns
        : never
      : never,
  >(
    table: T,
    columnName: ColumnName,
  ): ColumnDefinition<DataType, IsNotNull, HasDefault>;
  referencesSelf(columnName: string): ColumnDefinition<DataType, IsNotNull, HasDefault>;

  /** @internal */
  getDefinition(): ColumnDefinitionFormat;
}

export const makeColumnDefinition = <
  DataType,
  IsNotNull extends boolean = false,
  HasDefault extends boolean = false,
>(
  dataType: string,
  enumValues?: string[],
): ColumnDefinition<DataType, IsNotNull, HasDefault> => {
  let isNotNull = false;
  let isPrimaryKey = false;
  let defaultExpression: string | undefined = undefined;
  let checkExpression: string | undefined = undefined;
  let isUnique = false;
  let referencesTable: any = undefined;
  let referencesSelf: boolean = false;
  let referencesColumn: string | undefined = undefined;

  return {
    getDefinition() {
      return {
        dataType,
        isNotNull,
        isPrimaryKey,
        defaultExpression,
        checkExpression,
        isUnique,
        referencesTable,
        referencesSelf,
        referencesColumn,
        enumValues,
      };
    },

    notNull() {
      isNotNull = true;

      return this as any;
    },

    primaryKey() {
      isPrimaryKey = true;

      return this as any;
    },

    default(expression: string) {
      defaultExpression = expression;

      return this as any;
    },

    check(expression) {
      checkExpression = expression;

      return this as any;
    },

    unique() {
      isUnique = true;

      return this as any;
    },

    references(table, columnName) {
      referencesTable = table;
      referencesColumn = columnName;

      return this as any;
    },

    referencesSelf(columnName) {
      referencesSelf = true;
      referencesColumn = columnName;
      return this as any;
    },
  };
};

// Base class for any typed column reference — either a table column (Column) or a
// subquery/CTE column reference. Carries TableName and JoinType as type parameters
// so join logic in select.ts and result-set.ts can treat both uniformly.
export class ColumnExpression<
  Name extends string,
  TableName,
  DataType,
  IsNotNull extends boolean,
  JoinType = never,
> extends Expression<DataType, IsNotNull, Name> {
  constructor(
    tokens: Token[],
    protected readonly columnName: Name,
    protected readonly tableName: TableName,
    protected readonly originalColumnName: string | undefined,
  ) {
    super(tokens, columnName, originalColumnName !== undefined);
  }

  as<NewName extends string>(
    name: NewName,
  ): ColumnExpression<NewName, TableName, DataType, IsNotNull, JoinType> {
    const sqlName = this.originalColumnName ?? this.columnName;
    return new ColumnExpression<NewName, TableName, DataType, IsNotNull, JoinType>(
      [new StringToken(`${wrapQuotes(this.tableName as string)}.${wrapQuotes(sqlName)}`)],
      name,
      this.tableName,
      sqlName,
    );
  }
}

// This is only used as a nominal type, not actually as an instance.
export class ColumnSet<Columns> {
  private _columnSetBrand: any;

  /** @internal */
  toTokens(): Token[] {
    return [];
  }
}

export class Column<
  Name extends string,
  TableName,
  DataType,
  IsNotNull extends boolean,
  HasDefault extends boolean,
  JoinType = never,
> extends ColumnExpression<Name, TableName, DataType, IsNotNull, JoinType> {
  /** @internal */
  getSnakeCaseName() {
    return wrapQuotes(toSnakeCase(this.columnName));
  }

  /** @internal */
  getName() {
    return this.columnName;
  }

  /** @internal */
  getDefinition() {
    return this.definition;
  }

  constructor(
    private readonly definition: ColumnDefinition<DataType, IsNotNull, HasDefault>,
    columnName: Name,
    tableName: TableName,
    originalColumnName: string | undefined,
  ) {
    super(
      [
        new StringToken(
          `${wrapQuotes(tableName as unknown as string)}.${wrapQuotes(
            toSnakeCase(originalColumnName ?? columnName),
          )}`,
        ),
      ],
      columnName,
      tableName,
      originalColumnName,
    );
  }

  override as<AliasName extends string>(
    alias: AliasName,
  ): Column<AliasName, TableName, DataType, IsNotNull, HasDefault, JoinType> {
    return new Column(this.definition, alias, this.tableName, this.columnName as unknown as string);
  }

  /** @internal */
  toTokens(includeAlias?: boolean): Token[] {
    const snakeCaseColumnName = toSnakeCase(this.columnName as unknown as string);
    const toStringTokens = (tableName: TableName, columnName: string, alias?: string) => {
      const initialToken = new StringToken(
        `${wrapQuotes(tableName as unknown as string)}.${wrapQuotes(columnName)}`,
      );

      if (!alias) {
        return [initialToken];
      }

      return [initialToken, new StringToken(wrapQuotes(alias, true))];
    };

    if (includeAlias) {
      return this.originalColumnName
        ? toStringTokens(this.tableName, toSnakeCase(this.originalColumnName), this.columnName)
        : snakeCaseColumnName === (this.columnName as unknown)
          ? toStringTokens(this.tableName, snakeCaseColumnName)
          : toStringTokens(this.tableName, snakeCaseColumnName, this.columnName);
    }

    return this.originalColumnName
      ? toStringTokens(this.tableName, toSnakeCase(this.originalColumnName))
      : toStringTokens(this.tableName, snakeCaseColumnName);
  }
}
