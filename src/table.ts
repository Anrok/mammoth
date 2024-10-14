import exp from 'constants';
import { Column, ColumnDefinition, ColumnDefinitionsToColumns } from './column';
import { Index, IndexDefinition, IndexDefinitionsToIndexes } from './table-index';

import { Table } from './TableType';
import { StringToken, TableToken } from './tokens';
import { DbNull } from './types';

export type TableRow<T> =
  T extends TableDefinition<infer Columns, any>
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

export class TableDefinition<Columns extends {[K: string]: ColumnDefinition<any, any, any>}, Indexes> {
  private _tableDefinitionBrand: any;
  columns: Columns;
  defineIndexes: (columns: ColumnDefinitionsToColumns<any, Columns>) => Indexes;

  constructor(
    columns: Columns,
    defineIndexes: (columns: ColumnDefinitionsToColumns<any, Columns>) => Indexes = () => ({} as Indexes)
  ) {
    this.columns = columns;
    this.defineIndexes = defineIndexes;
  }
}

export const makeTable = <
  TableName extends string,
  ColumnDefinitions extends {[column: string]: ColumnDefinition<any, any, any> },
  IndexDefinitions extends {[index: string]: IndexDefinition<
    boolean,
    boolean
  >},
>(
  tableName: TableName,
  originalTableName: string | undefined,
  tableDefinition: {
    columns: ColumnDefinitions,
    defineIndexes?: (columns: ColumnDefinitionsToColumns<TableName, ColumnDefinitions>) => IndexDefinitions,
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

  const columnsForIndexes = columnNames.reduce(
    (map, columnName) => {
      const column = new Column(columnName as string, tableName, undefined, true) as any;
      map[columnName] = column;
      return map;
    },
    {} as ColumnDefinitionsToColumns<TableName, ColumnDefinitions>,
  );

  const indexDefinitions = tableDefinition.defineIndexes?.(columnsForIndexes) ?? {} as IndexDefinitions;

  const indexNames = Object.keys(
    indexDefinitions as unknown as object,
  ) as (keyof IndexDefinitions)[];

  const indexes = indexNames.reduce(
    (map, indexName) => {
      const {
        expressions,
        include,
        where,
        type,
        isPrimaryKey,
        isUniqueKey,
      } = indexDefinitions[indexName].getDefinition();
      const index = new Index(indexName as string, tableName, type, isPrimaryKey, isUniqueKey, expressions, include, where) as any;
      map[indexName] = index;
      return map;
    },
    {} as IndexDefinitionsToIndexes<TableName, IndexDefinitions>,
  );

  const table = {
    ...columns,
    as<T extends string>(alias: T) {
      return makeTable(alias, tableName, tableDefinition as any) as any;
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
  TableName extends string,
  Columns extends { [column: string]: ColumnDefinition<any, boolean, boolean> },
  IndexNames extends string,
  Indexes extends { [Index in IndexNames]: IndexDefinition<boolean, boolean> },
>(
  tableDefinition: {
    columns: Columns,
    defineIndexes?(columns: ColumnDefinitionsToColumns<TableName, Columns>): Indexes,
  },
): TableDefinition<Columns, Indexes> => {
  return tableDefinition as any;
};
