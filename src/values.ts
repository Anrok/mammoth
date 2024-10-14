import { Table } from './TableType';
import { Column, ColumnDefinition, ColumnDefinitionsToColumns } from './column';
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

export function makeValues<
  TableName extends string,
  ColumnDefinitionsT extends { [column: string]: ColumnDefinition<any, any, any> },
>(
  tableName: TableName,
  definition: ColumnDefinitionsT,
  values: Array<TableRow<TableDefinition<ColumnDefinitionsT, any>>>,
): Table<TableName, ColumnDefinitionsToColumns<TableName, ColumnDefinitionsT>, {}> {
  const columnNames = Object.keys(definition as unknown as object) as (keyof ColumnDefinitionsT)[];

  const columns = columnNames.reduce(
    (map, columnName) => {
      const column = new Column(columnName as string, tableName, undefined) as any;
      map[columnName] = column;
      return map;
    },
    {} as Table<
      TableName,
      {
        [K in keyof ColumnDefinitionsT]: K extends string
          ? ColumnDefinitionsT[K] extends ColumnDefinition<
              infer DataType,
              infer IsNotNull,
              infer HasDefault
            >
            ? Column<K, TableName, DataType, IsNotNull, HasDefault, undefined>
            : never
          : never;
      },
      {}
    >,
  );

  const table = {
    ...columns,
    as<T extends string>(alias: T) {
      return makeValues(alias, definition, values) as any;
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
                    columnNames.map((key) => {
                      const columnValueToken = new ParameterToken((value as any)[key] as any);

                      if (index === 0) {
                        // Cast on the first row only to ensure correct types in the list.
                        return new CollectionToken([
                          columnValueToken,
                          new StringToken('::'),
                          new StringToken(
                            (definition[key] as any).getDefinition().dataType as string,
                          ),
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
            columnNames.map((key) => new StringToken(`"${toSnakeCase(key as string)}"`)),
          ),
        ]),
      ];
    },
  };
  return table;
}
