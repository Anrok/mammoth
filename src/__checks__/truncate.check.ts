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

describe('truncate', () => {
  test('should truncate', () => {
    expect(toSnap(db.truncate(db.foo))).type.toEqual<never>();
  });

  test('should truncate ans await affected row count', async () => {
    expect(await db.truncate(db.foo)).type.toEqual<number>();
  });
});
