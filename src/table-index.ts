import { ColumnDefinition, ColumnDefinitionsToColumns } from "./column"
import { DefaultExpression } from "./expression";
import { Table } from "./TableType";

export type IndexDefinitionsToIndexes<
  IndexDefinitionsT extends { [column: string]: IndexDefinition<string, boolean, boolean, any> },
> = {
  [IndexName in keyof IndexDefinitionsT]: IndexName extends string
    ? IndexDefinitionsT[IndexName] extends IndexDefinition<
        infer TableName,
        infer IsPrimaryKey,
        infer IsUniqueKey,
        infer ColumnDefinitions
      >
      ? Index<TableName, IsPrimaryKey, IsUniqueKey, ColumnDefinitions>
      : never
    : never;
};

export interface IndexDefinitionFormat {
  columns: string[];
  isUniqueKey: boolean;
  isPrimaryKey: boolean;
  includes: string[];
  where?: (table: any) => DefaultExpression<boolean>;
}

export interface IndexDefinition<
    TableNameT extends string,
    IsPrimaryKeyT extends boolean,
    IsUniqueKeyT extends (IsPrimaryKeyT extends true ? true : boolean),
    ColumnDefinitionsT extends { [column: string]: ColumnDefinition<any, any, any> }
> {
    columns: (keyof ColumnDefinitionsT)[];
    isUniqueKey?: IsUniqueKeyT;
    isPrimaryKey?: IsPrimaryKeyT;
    includes?: (keyof ColumnDefinitionsT)[];
    where?: (table: Table<TableNameT, ColumnDefinitionsToColumns<TableNameT, ColumnDefinitionsT>>) => DefaultExpression<boolean>;
}

export type Index<
    IndexNameT extends string,
    IsPrimaryKeyT extends boolean,
    IsUniqueKeyT extends (IsPrimaryKeyT extends true ? true : boolean),
    ColumnDefinitionsT extends { [column: string]: ColumnDefinition<any, any, any> }
> = {
    name: IndexNameT;
    tableName: string;
    columns: ColumnDefinitionsToColumns<string, ColumnDefinitionsT>[];
    isUniqueKey: IsUniqueKeyT;
    isPrimaryKey: IsPrimaryKeyT;
    includes: ColumnDefinitionsToColumns<string, ColumnDefinitionsT>[];
    where: DefaultExpression<boolean, false> | null;
}

export const makeIndexDefinition = <
    TableName extends string,
    IsPrimaryKey extends boolean = false,
    IsUniqueKey extends boolean = false,
    ColumnDefinitions extends { [column: string]: ColumnDefinition<any, any, any> },
>(indexType: string) => {
    let isUniqueKey = false;
    let isPrimaryKey = false;
    let includes: string[] = [];
    let where: ((table: any) => DefaultExpression<boolean>) | undefined = undefined;

    return {
        columns: [] as (keyof ColumnDefinitions)[],
        isUniqueKey,
        isPrimaryKey,
        includes,
        where,
    };
}
