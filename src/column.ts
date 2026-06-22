import { GroupToken, ParameterToken, SeparatorToken, StringToken, Token } from './tokens';
import { toSnakeCase, wrapQuotes } from './naming';

import { Expression } from './expression';
import { TableDefinition } from './table';

export interface ColumnDefinitionFormat {
  dataType: string;
  isNotNull: boolean;
  // Type-only marker. Forces the column to be required and non-null when writing (INSERT /
  // UPDATE / ON CONFLICT) while it stays nullable in Postgres and on read. Intended for a column
  // that will become NOT NULL but isn't fully backfilled yet: every write site is forced (via a
  // type error) to supply a value, while reads still surface it as possibly-null.
  //
  // NOTE: this is intentionally invisible to DDL generation and to schema diffing — it changes no
  // runtime SQL. The actual NOT NULL constraint is added by a later migration, at which point the
  // column should be switched from `.requiredOnWrite()` to `.notNull()`.
  isRequiredOnWrite: boolean;
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
  RequiredOnWrite extends boolean = false,
> {
  notNull(): ColumnDefinition<DataType, true, HasDefault, RequiredOnWrite>;
  // Require this column on write while leaving it nullable on read and in Postgres. Use for a
  // column mid-backfill that will become NOT NULL: writes are forced to supply a value, reads
  // still warn it may be null. See `ColumnDefinitionFormat.isRequiredOnWrite`.
  requiredOnWrite(): ColumnDefinition<DataType, IsNotNull, HasDefault, true>;
  primaryKey(): ColumnDefinition<DataType, true, HasDefault, RequiredOnWrite>;
  default(expression: string): ColumnDefinition<DataType, IsNotNull, true, RequiredOnWrite>;
  // In most cases a default clause means you do not need to provide any value during insert. In
  // theory however it's possible the default expression doesn't set a value in some case. In the
  // case of a NOT NULL constraint this would mean you'd have to set a value when inserting. Because
  // this is not neccesary in most of the cases we just assume a default expression will always set
  // a value. You can opt out of this by setting `IsAlwaysSettingAValue` to false.
  default<IsAlwaysSettingAValue extends boolean>(
    expression: string,
  ): ColumnDefinition<DataType, IsNotNull, IsAlwaysSettingAValue, RequiredOnWrite>;
  check(expression: string): ColumnDefinition<DataType, IsNotNull, HasDefault, RequiredOnWrite>;
  unique(): ColumnDefinition<DataType, IsNotNull, HasDefault, RequiredOnWrite>;
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
  ): ColumnDefinition<DataType, IsNotNull, HasDefault, RequiredOnWrite>;
  referencesSelf(
    columnName: string,
  ): ColumnDefinition<DataType, IsNotNull, HasDefault, RequiredOnWrite>;

  /** @internal */
  getDefinition(): ColumnDefinitionFormat;
}

/**
 * Whether a column must be supplied (and be non-null) when writing. True for NOT NULL columns and
 * for columns explicitly marked `.requiredOnWrite()`. Read-side types must NOT use this — reads
 * key off `IsNotNull` alone so a `.requiredOnWrite()` column still reads as nullable.
 */
export type IsRequiredOnWrite<
  IsNotNull extends boolean,
  RequiredOnWrite extends boolean,
> = IsNotNull extends true ? true : RequiredOnWrite;

export const makeColumnDefinition = <
  DataType,
  IsNotNull extends boolean = false,
  HasDefault extends boolean = false,
  RequiredOnWrite extends boolean = false,
>(
  dataType: string,
  enumValues?: string[],
): ColumnDefinition<DataType, IsNotNull, HasDefault, RequiredOnWrite> => {
  let isNotNull = false;
  let isRequiredOnWrite = false;
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
        isRequiredOnWrite,
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

    requiredOnWrite() {
      isRequiredOnWrite = true;

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
  JoinType,
  // Phantom: required and non-null on write, but nullable on read. See `IsRequiredOnWrite`.
  RequiredOnWrite extends boolean = false,
> extends Expression<DataType, IsNotNull, Name> {
  private _columnBrand: any;

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
    private readonly definition: ColumnDefinition<DataType, IsNotNull, HasDefault, RequiredOnWrite>,
    private readonly columnName: Name,
    private readonly tableName: TableName,
    private readonly originalColumnName: string | undefined,
  ) {
    super(
      originalColumnName
        ? [
            new StringToken(
              `${wrapQuotes(tableName as unknown as string)}.${wrapQuotes(
                toSnakeCase(originalColumnName),
              )}`,
            ),
          ]
        : [
            new StringToken(
              `${wrapQuotes(tableName as unknown as string)}.${wrapQuotes(
                toSnakeCase(columnName),
              )}`,
            ),
          ],
      columnName as any,
    );
  }

  as<AliasName extends string>(
    alias: AliasName,
  ): Column<AliasName, TableName, DataType, IsNotNull, HasDefault, JoinType, RequiredOnWrite> {
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
