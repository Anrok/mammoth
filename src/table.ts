import { Column, ColumnDefinition, ColumnDefinitionsToColumns } from './column';
import { Index, IndexDefinition, IndexDefinitionsToIndexes } from './table-index';

import { Table } from './TableType';
import { TableToken } from './tokens';
import { DbNull } from './types';

export type TableRow<T> =
  T extends TableDefinition<infer Columns>
    ? {
        [K in keyof Columns]: Columns[K] extends ColumnDefinition<
          infer DataType,
          infer IsNotNull,
          boolean
        >
          ? IsNotNull extends true
            ? DataType
            : DataType | DbNull
          : never;
      }
    : never;

export class TableDefinition<Columns> {
  private _tableDefinitionBrand: any;

  public columns: Record<string, unknown>;
  public indexes: Record<string, unknown>;

  constructor(
    columns: Record<string, unknown>,
    indexes: Record<string, unknown>,
  ) {
    this.columns = columns;
    this.indexes = indexes;
  }
}

export const makeTable = <
  TableName extends string,
  ColumnDefinitions extends {[column: string]: ColumnDefinition<any, any, any> },
  IndexDefinitions extends {[index: string]: IndexDefinition<string, boolean, boolean, ColumnDefinitions>},
>(
  tableName: TableName,
  originalTableName: string | undefined,
  tableDefinition: {
    columns: ColumnDefinitions,
    indexes: IndexDefinitions,
  },
) => {
  const columnNames = Object.keys(
    tableDefinition['columns'] as unknown as object,
  ) as (keyof ColumnDefinitions)[];

  const columns = columnNames.reduce(
    (map, columnName) => {
      const column = new Column(columnName as string, tableName, undefined) as any;
      map[columnName] = column;
      return map;
    },
    {} as ColumnDefinitionsToColumns<TableName, ColumnDefinitions>,
  );

  const indexNames = Object.keys(
    tableDefinition['indexes'] as unknown as object,
  ) as (keyof IndexDefinitions)[];

  const indexes = indexNames.reduce(
    (map, indexName) => {
      const {
        columns: indexColumns,
        includes,
        where,
        isPrimaryKey,
        isUniqueKey,
      } = tableDefinition['indexes'][indexName];
      const index = {
        isPrimaryKey: isPrimaryKey ?? false,
        isUniqueKey: isUniqueKey ?? false,
        columns: indexColumns.map((columnName) => columns[columnName]),
        includes: includes !== undefined ? includes.map((columnName) => columns[columnName]) : [],
        where: where !== undefined ? where({...columns} as any) : null,
      } as any;
      map[indexName] = index;
      return map;
    },
    {} as IndexDefinitionsToIndexes<IndexDefinitions>,
  );

  const table = {
    ...columns,
    as<T extends string>(alias: T) {
      return makeTable(alias, tableName, tableDefinition) as any;
    },
    getName() {
      return tableName;
    },
    getOriginalName() {
      return originalTableName;
    },
    toTokens() {
      return [new TableToken(this)];
    },
    getIndexes() {
      return indexes;
    }
  };
  return table;
};

export const defineTable = <
  Columns extends { [column: string]: ColumnDefinition<any, boolean, boolean> },
  Indexes extends { [index: string]: IndexDefinition<string, boolean, boolean, Columns> },
>(
  tableDefinition: {
    columns: Columns,
    indexes: Indexes,
  },
): TableDefinition<Columns> => {
  return tableDefinition as any;
};
