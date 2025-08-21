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

describe('delete', () => {
  test('should delete and returning id', () => {
    expect(toSnap(db.deleteFrom(db.foo).returning(`id`))).type.toBe<{ id: string }>();
  });

  test('should delete and await affected row count', async () => {
    expect(await db.deleteFrom(db.foo)).type.toBe<number>();
  });

  test('should delete and await rows', async () => {
    expect(await db.deleteFrom(db.foo).returning(`id`)).type.toBe<{ id: string }[]>();
  });
});
