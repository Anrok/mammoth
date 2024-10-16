import { defineDb, defineTable, integer, text, timestampWithTimeZone, uuid } from '..';

import { enumType } from '../data-types';

describe(`ddl`, () => {
  const foo = defineTable({
    id: uuid().primaryKey().default(`gen_random_uuid()`),
    createDate: timestampWithTimeZone().notNull().default(`now()`),
    name: text().notNull(),
    value: integer(),
    enumTest: enumType('my_enum_type', ['A', 'B', 'C']),
  });

  const db = defineDb(
    {
      foo,
    },
    () => Promise.resolve({ rows: [], affectedCount: 0 }),
  );

  it(`should retrieve column definition info`, () => {
    const tableDefinitions = db.getTableDefinitions();

    expect(tableDefinitions).toMatchInlineSnapshot(`
      [
        {
          "columns": [
            {
              "checkExpression": undefined,
              "dataType": "uuid",
              "defaultExpression": "gen_random_uuid()",
              "enumValues": undefined,
              "isNotNull": false,
              "isPrimaryKey": true,
              "isUnique": false,
              "name": "id",
              "referencesColumn": undefined,
              "referencesSelf": false,
              "referencesTable": undefined,
            },
            {
              "checkExpression": undefined,
              "dataType": "timestamp with time zone",
              "defaultExpression": "now()",
              "enumValues": undefined,
              "isNotNull": true,
              "isPrimaryKey": false,
              "isUnique": false,
              "name": "createDate",
              "referencesColumn": undefined,
              "referencesSelf": false,
              "referencesTable": undefined,
            },
            {
              "checkExpression": undefined,
              "dataType": "text",
              "defaultExpression": undefined,
              "enumValues": undefined,
              "isNotNull": true,
              "isPrimaryKey": false,
              "isUnique": false,
              "name": "name",
              "referencesColumn": undefined,
              "referencesSelf": false,
              "referencesTable": undefined,
            },
            {
              "checkExpression": undefined,
              "dataType": "integer",
              "defaultExpression": undefined,
              "enumValues": undefined,
              "isNotNull": false,
              "isPrimaryKey": false,
              "isUnique": false,
              "name": "value",
              "referencesColumn": undefined,
              "referencesSelf": false,
              "referencesTable": undefined,
            },
            {
              "checkExpression": undefined,
              "dataType": "my_enum_type",
              "defaultExpression": undefined,
              "enumValues": [
                "A",
                "B",
                "C",
              ],
              "isNotNull": false,
              "isPrimaryKey": false,
              "isUnique": false,
              "name": "enumTest",
              "referencesColumn": undefined,
              "referencesSelf": false,
              "referencesTable": undefined,
            },
          ],
          "indexes": [],
          "name": "foo",
          "originalDefinition": {
            "columns": {
              "createDate": {
                "check": [Function],
                "default": [Function],
                "getDefinition": [Function],
                "notNull": [Function],
                "primaryKey": [Function],
                "references": [Function],
                "referencesSelf": [Function],
                "unique": [Function],
              },
              "enumTest": {
                "check": [Function],
                "default": [Function],
                "getDefinition": [Function],
                "notNull": [Function],
                "primaryKey": [Function],
                "references": [Function],
                "referencesSelf": [Function],
                "unique": [Function],
              },
              "id": {
                "check": [Function],
                "default": [Function],
                "getDefinition": [Function],
                "notNull": [Function],
                "primaryKey": [Function],
                "references": [Function],
                "referencesSelf": [Function],
                "unique": [Function],
              },
              "name": {
                "check": [Function],
                "default": [Function],
                "getDefinition": [Function],
                "notNull": [Function],
                "primaryKey": [Function],
                "references": [Function],
                "referencesSelf": [Function],
                "unique": [Function],
              },
              "value": {
                "check": [Function],
                "default": [Function],
                "getDefinition": [Function],
                "notNull": [Function],
                "primaryKey": [Function],
                "references": [Function],
                "referencesSelf": [Function],
                "unique": [Function],
              },
            },
            "defineIndexes": [Function],
          },
        },
      ]
    `);
  });
});
