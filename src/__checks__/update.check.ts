import { defineDb, defineTable, integer, text, timestampWithTimeZone, uuid } from '../';

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

const db = defineDb({ foo }, () => Promise.resolve({ rows: [], affectedCount: 0 }));

describe('update', () => {
  test('should update and returning id', () => {
    expect(toSnap(db.update(db.foo).set({ name: `Test`, value: 123 }).returning(`id`))).type.toBe<{
      id: string;
    }>();
  });

  test('should update and returning two columns', () => {
    expect(
      toSnap(db.update(db.foo).set({ name: `Test`, value: 123 }).returning(`id`, `name`)),
    ).type.toBe<{
      id: string;
      name: string;
    }>();
  });

  test('should update without returning and return number', () => {
    expect(toSnap(db.update(db.foo).set({ name: `Test`, value: 123 }))).type.toBeNumber();
  });

  test('should update and await affected count', async () => {
    expect(await db.update(db.foo).set({ name: `Test` })).type.toBeNumber();
  });

  test('should update-returning and await rows', async () => {
    expect(await db.update(db.foo).set({ name: `Test` }).returning(`name`)).type.toBe<
      { name: string }[]
    >();
  });
});
