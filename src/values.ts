import { Table } from './TableType';
import { Column, ColumnDefinition } from './column';
import { toSnakeCase } from './naming';
import { TableDefinition, TableRow } from './table';
import {
  CollectionToken,
  GroupToken,
  ParameterToken,
  SeparatorToken,
  StringToken,
  TableToken,
} from './tokens';

type ColumnDefinitionsToColumns<
  TableNameT extends string,
  ColumnDefinitionsT extends { [column: string]: ColumnDefinition<any, any, any> },
> = {
  [ColumnName in keyof ColumnDefinitionsT]: ColumnName extends string
    ? ColumnDefinitionsT[ColumnName] extends ColumnDefinition<
        infer DataType,
        infer IsNotNull,
        infer HasDefault
      >
      ? Column<ColumnName, TableNameT, DataType, IsNotNull, HasDefault, undefined>
      : never
    : never;
};

export function makeValues<
  TableName extends string,
  TableDefinitionT extends { [column: string]: ColumnDefinition<any, any, any> },
>(
  tableName: TableName,
  tableDefinition: TableDefinitionT,
  values: Array<TableRow<TableDefinition<TableDefinitionT>>>,
): Table<TableName, ColumnDefinitionsToColumns<TableName, TableDefinitionT>> {
  const columnEntries = Object.entries(tableDefinition as unknown as object) as [
    keyof TableDefinitionT,
    ColumnDefinition<any, any, any>,
  ][];

  const columns = columnEntries.reduce(
    (map, [columnName, columnDefinition]) => {
      const column = new Column(
        columnDefinition,
        columnName as string,
        tableName,
        undefined,
      ) as any;
      map[columnName] = column;
      return map;
    },
    {} as Table<
      TableName,
      {
        [K in keyof TableDefinitionT]: K extends string
          ? TableDefinitionT[K] extends ColumnDefinition<
              infer DataType,
              infer IsNotNull,
              infer HasDefault
            >
            ? Column<K, TableName, DataType, IsNotNull, HasDefault, undefined>
            : never
          : never;
      }
    >,
  );

  const table = {
    ...columns,
    as<T extends string>(alias: T) {
      return makeValues(alias, tableDefinition, values) as any;
    },
    getName() {
      return tableName;
    },
    getOriginalName() {
      return undefined;
    },
    toTokens() {
      return [
        new GroupToken([
          new StringToken('VALUES'),
          new SeparatorToken(
            ',',
            [...values.entries()].map(
              ([index, value]) =>
                new GroupToken([
                  new SeparatorToken(
                    ',',
                    columnEntries.map(([columnName, columnDefinition]) => {
                      const columnValueToken = new ParameterToken(
                        (value as any)[columnName] as any,
                      );

                      if (index === 0) {
                        // Cast on the first row only to ensure correct types in the list.
                        return new CollectionToken([
                          columnValueToken,
                          new StringToken('::'),
                          new StringToken(columnDefinition.getDefinition().dataType),
                        ]);
                      }

                      return columnValueToken;
                    }),
                  ),
                ]),
            ),
          ),
        ]),
        new StringToken('AS'),
        new TableToken(this),
        new GroupToken([
          new SeparatorToken(
            ',',
            columnEntries.map(
              ([columnName]) => new StringToken(`"${toSnakeCase(columnName as string)}"`),
            ),
          ),
        ]),
      ];
    },
  };
  return table;
}
