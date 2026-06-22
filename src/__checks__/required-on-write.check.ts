import { TableRow, defineDb, defineTable, integer, star, text, uuid } from '../';

import { Query } from '../query';
import { ResultSet } from '../result-set';
import { expect, describe, test } from 'tstyche';

const toSnap = <T extends Query<any>>(query: T): ResultSet<T> => {
  return undefined as any;
};

const toTableRow = <T>(table: T): TableRow<T> => {
  return undefined as any;
};

// `backfillCol` is declared `.requiredOnWrite()`: the Postgres column is still nullable (so reads
// surface it as possibly-null), but every write must supply a non-null value. This is the state a
// column lives in while a NOT NULL backfill is in flight.
const foo = defineTable({
  id: uuid().primaryKey().default(`gen_random_uuid()`),
  name: text().notNull(),
  value: integer(),
  backfillCol: text().requiredOnWrite(),
});

const db = defineDb({ foo }, () => Promise.resolve({ rows: [], affectedCount: 0 }));

describe('requiredOnWrite', () => {
  // --- read side: still nullable -------------------------------------------------------------
  test('reads as nullable (TableRow)', () => {
    expect(toTableRow(foo)).type.toBe<{
      id: string;
      name: string;
      value: number | null;
      backfillCol: string | null;
    }>();
  });

  test('reads as nullable (select *)', () => {
    expect(toSnap(db.select(star()).from(db.foo))).type.toBe<{
      id: string;
      name: string;
      value: number | null;
      backfillCol: string | null;
    }>();
  });

  // --- write side: required & non-null -------------------------------------------------------
  test('insert requires the column', () => {
    expect(db.insertInto(db.foo).values).type.not.toBeCallableWith({ name: `Test` });
  });

  test('insert rejects null for the column', () => {
    expect(db.insertInto(db.foo).values).type.not.toBeCallableWith({
      name: `Test`,
      backfillCol: null,
    });
  });

  test('insert accepts a non-null value', () => {
    expect(
      toSnap(db.insertInto(db.foo).values({ name: `Test`, backfillCol: `x` })),
    ).type.toBe<number>();
  });

  test('update rejects null for the column', () => {
    expect(db.update(db.foo).set).type.not.toBeCallableWith({ backfillCol: null });
  });

  test('update accepts a non-null value', () => {
    expect(db.update(db.foo).set({ backfillCol: `x` })).type.toBeAssignableWith(
      db.update(db.foo).set({ backfillCol: `x` }),
    );
  });

  // A genuinely-nullable column is unaffected: still optional, still accepts null.
  test('nullable column stays nullable on write', () => {
    expect(
      toSnap(db.insertInto(db.foo).values({ name: `Test`, backfillCol: `x`, value: null })),
    ).type.toBe<number>();
    expect(db.update(db.foo).set({ value: null })).type.toBeAssignableWith(
      db.update(db.foo).set({ value: null }),
    );
  });
});
