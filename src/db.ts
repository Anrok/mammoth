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
import { StringToken, Token } from './tokens';

const createTables = <TableDefinitions extends { [key: string]: TableDefinition<any> }>(
  tableDefinitions: TableDefinitions,
): {
  [TableName in keyof TableDefinitions]: TableDefinitions[TableName] extends TableDefinition<
    infer ColumnDefinitions
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

const makeQueryStartFunctions = (queryExecutor: QueryExecutorFn, commentTokens: Token[]) => {
  return {
    select: makeSelect(queryExecutor, commentTokens),
    selectDistinct: makeSelect(queryExecutor, commentTokens, [], { isDistinct: true }),
    insertInto: makeInsertInto(queryExecutor, commentTokens),
    deleteFrom: makeDeleteFrom(queryExecutor, commentTokens),
    update: makeUpdate(queryExecutor, commentTokens),
    truncate: makeTruncate(queryExecutor, commentTokens),
  };
};

export const defineDb = <TableDefinitions extends { [key: string]: TableDefinition<any> }>(
  tableDefinitions: TableDefinitions,
  queryExecutor: QueryExecutorFn,
) => {
  return {
    /** @internal */
    getTableDefinitions(): {
      name: string;
      originalDefinition: any;
      columns: (ColumnDefinitionFormat & { name: string })[];
    }[] {
      const tableNames = Object.keys(tableDefinitions);

      return tableNames.map((tableName) => {
        const table = tableDefinitions[tableName];
        const columnNames = Object.keys(table);

        return {
          name: tableName,
          columns: columnNames.map((columnName) => ({
            name: columnName,
            ...(table as any)[columnName].getDefinition(),
          })),
          originalDefinition: table,
        };
      });
    },
    comment: (comment: string) =>
      makeQueryStartFunctions(queryExecutor, [getCommentToken(comment)]),
    ...makeQueryStartFunctions(queryExecutor, []),
    with: makeWith(),
    values: makeValues,
    case: () => new CaseStatement<never>([]),
    ...sqlFunctions,

    ...createTables(tableDefinitions),
  };
};

const endCommentRe = /\*\//;

export function getCommentToken(comment: string): Token {
  if (endCommentRe.test(comment)) throw new Error('Found "*/" in comment contents.');
  return new StringToken(`/*${comment}*/`);
}
