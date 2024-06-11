import {
  defineDb,
  defineTable,
  integer,
  raw,
  serial,
  text,
  timestampWithTimeZone,
  uuid,
} from '../';
import { Table } from '../TableType';
import { Column } from '../column';
import { InsertQuery } from '../insert';
import { Query } from '../query';
import { ResultSet } from '../result-set';
import { expect, describe, test } from 'tstyche';

const toSnap = <T extends Query<any>>(query: T): ResultSet<T> => {
  return undefined as any;
};

const foo = defineTable({
  id: uuid().primaryKey().default(`gen_random_uuid()`),
  createDate: timestampWithTimeZone().notNull().default(`now()`),
  name: text().notNull(),
  value: integer(),
});

const serialTest = defineTable({
  id: serial().primaryKey(),
  value: integer(),
});

const db = defineDb({ foo, serialTest }, () => Promise.resolve({ rows: [], affectedCount: 0 }));

describe('insert', () => {
  test('should insert and returning count', () => {
    expect(toSnap(db.insertInto(db.foo).values({ name: `Test` }))).type.toBeNumber();
  });

  test('should insert multiple rows and returning count', () => {
    expect(
      toSnap(db.insertInto(db.foo).values([{ name: `Test` }, { name: `Test 2` }])),
    ).type.toBeNumber();
  });

  test('should insert default column', () => {
    expect(
      toSnap(db.insertInto(db.foo).values({ name: `Test`, createDate: new Date() })),
    ).type.toBeNumber();
  });

  test('should not insert unknown column', () => {
    expect(toSnap(db.insertInto(db.foo).values({ name: `Test`, asd: `Test` }))).type.toRaiseError();
  });

  test('should not insert invalid type in known column', () => {
    expect(toSnap(db.insertInto(db.foo).values({ name: 123 }))).type.toRaiseError();
  });

  test('should not insert multiple rows with invalid colums', () => {
    expect(
      toSnap(db.insertInto(db.foo).values([{ name: `Test` }, { name: `Test 2`, asd: 123 }])),
    ).type.toRaiseError();
  });

  test('should insert and await affect count', async () => {
    expect(await db.insertInto(db.foo).values({ name: `Test` })).type.toBeNumber();
  });

  test('should insert-returning and await rows', async () => {
    expect(await db.insertInto(db.foo).values({ name: `Test` }).returning(`name`)).type.toBe<
      { name: string }[]
    >();
  });

  test('should insert without explicit value for column serial', () => {
    expect(db.insertInto(db.serialTest).values({ value: 123 })).type.toBe<
      InsertQuery<
        Table<
          'serialTest',
          {
            id: Column<'id', 'serialTest', number, true, true, undefined>;
            value: Column<'value', 'serialTest', number, false, false, undefined>;
          }
        >,
        number,
        {
          id: Column<'id', 'serialTest', number, true, true, undefined>;
          value: Column<'value', 'serialTest', number, false, false, undefined>;
        }
      >
    >();
  });

  test('should insert with expression of the not-null correct type', () => {
    expect(
      db.insertInto(db.serialTest).values({ value: raw<number, true>`get_value()` }),
    ).type.toBe<
      InsertQuery<
        Table<
          'serialTest',
          {
            id: Column<'id', 'serialTest', number, true, true, undefined>;
            value: Column<'value', 'serialTest', number, false, false, undefined>;
          }
        >,
        number,
        {
          id: Column<'id', 'serialTest', number, true, true, undefined>;
          value: Column<'value', 'serialTest', number, false, false, undefined>;
        }
      >
    >();
  });

  test('should insert with expression of the nullable correct type', () => {
    expect(
      db.insertInto(db.serialTest).values({ value: raw<number, false>`get_value()` }),
    ).type.toBe<
      InsertQuery<
        Table<
          'serialTest',
          {
            id: Column<'id', 'serialTest', number, true, true, undefined>;
            value: Column<'value', 'serialTest', number, false, false, undefined>;
          }
        >,
        number,
        {
          id: Column<'id', 'serialTest', number, true, true, undefined>;
          value: Column<'value', 'serialTest', number, false, false, undefined>;
        }
      >
    >();
  });

  test('should not insert with wrong type of expression', () => {
    expect(
      db.insertInto(db.serialTest).values({ value: raw<string>`get_value()` }),
    ).type.toRaiseError();
  });

  test('should insert using subquery', () => {
    expect(
      db
        .insertInto(db.foo)
        .values({ name: db.select(db.foo.name.concat(` 2`)).from(db.foo).limit(1) }),
    ).type.toBe<
      InsertQuery<
        Table<
          'foo',
          {
            id: Column<'id', 'foo', string, true, true, undefined>;
            createDate: Column<'createDate', 'foo', Date, true, true, undefined>;
            name: Column<'name', 'foo', string, true, false, undefined>;
            value: Column<'value', 'foo', number, false, false, undefined>;
          }
        >,
        number,
        {
          id: Column<'id', 'foo', string, true, true, undefined>;
          createDate: Column<'createDate', 'foo', Date, true, true, undefined>;
          name: Column<'name', 'foo', string, true, false, undefined>;
          value: Column<'value', 'foo', number, false, false, undefined>;
        }
      >
    >();
  });
});
