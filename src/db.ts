import * as sqlFunctions from './sql-functions';
import { Column, ColumnDefinition, ColumnDefinitionFormat } from './column';
import { makeInsertInto } from './insert';
import { makeSelect } from './select';
import { TableDefinition, makeTable } from './table';
import { CaseStatement } from './case';
import { QueryExecutorFn } from './types';
import { Table } from './TableType';
import { makeDeleteFrom } from './delete';
import { makeTruncate } from './truncate';
import { makeUpdate } from './update';
import { makeWith } from './with';
import { toSnakeCase } from './naming';
import { makeValues } from './values';
import { Index, IndexDefinition } from './table-index';
import { StringToken } from './tokens';

const createTables = <TableDefinitions extends { [key: string]: TableDefinition<any, any> }>(
  tableDefinitions: TableDefinitions,
): {
  [TableName in keyof TableDefinitions]: TableDefinitions[TableName] extends TableDefinition<
    infer ColumnDefinitions,
    infer IndexDefinitions
  >
    ? Table<
        TableName,
        {
          [K in keyof ColumnDefinitions]: K extends string
            ? ColumnDefinitions[K] extends ColumnDefinition<
                infer DataType,
                infer IsNotNull,
                infer HasDefault
              >
              ? Column<K, TableName, DataType, IsNotNull, HasDefault, undefined>
              : never
            : never;
        },
        {
          [K in keyof IndexDefinitions]: K extends string
            ? IndexDefinitions[K] extends IndexDefinition<
                infer IsPrimaryKey,
                infer IsUniqueKey
              >
              ? Index<K, TableName extends string ? TableName : never, IsPrimaryKey, IsUniqueKey>
              : never
            : never;
        }
      >
    : never;
} => {
  return Object.keys(tableDefinitions).reduce((tables, key) => {
    const tableDefinition = tableDefinitions[key];

    tables[key] = makeTable(toSnakeCase(key), undefined, tableDefinition as any);

    return tables;
  }, {} as any);
};

export const defineDb = <TableDefinitions extends { [key: string]: TableDefinition<any, any> }>(
  tableDefinitions: TableDefinitions,
  queryExecutor: QueryExecutorFn,
) => {
  return {
    /** @internal */
    getTableDefinitions(): {
      name: string;
      originalDefinition: any;
      columns: (ColumnDefinitionFormat & { name: string })[];
      indexes: IndexDefinition<boolean, boolean>[];
    }[] {
      const tableNames = Object.keys(tableDefinitions);

      return tableNames.map((tableName) => {
        const table = tableDefinitions[tableName] as TableDefinition<any, any>;
        const columnNames = Object.keys(table.columns);

        // Recompute columns to determine index definitions. A little inefficient, but this function is
        // only intended to be used for debugging and testing purposes.
        const columns = columnNames.reduce(
          (map, columnName) => {
            const column = new Column(columnName as string, tableName, undefined) as any;
            map[columnName] = column;
            return map;
          },
          {} as any,
        );
        const indexDefinitions = table.defineIndexes !== undefined ? table.defineIndexes(columns) : {};
        const indexNames = Object.keys(indexDefinitions);

        return {
          name: tableName,
          columns: columnNames.map((columnName) => ({
            name: columnName,
            ...table.columns[columnName].getDefinition(),
          })),
          indexes: indexNames.map((indexName) => indexDefinitions[indexName].getDefinition()),
          originalDefinition: table,
        };
      });
    },
    select: makeSelect(queryExecutor),
    insertInto: makeInsertInto(queryExecutor),
    deleteFrom: makeDeleteFrom(queryExecutor),
    update: makeUpdate(queryExecutor),
    with: makeWith(queryExecutor),
    truncate: makeTruncate(queryExecutor),
    values: makeValues,
    case: () => new CaseStatement<never>([]),
    ...sqlFunctions,

    ...createTables(tableDefinitions),
  };
};
