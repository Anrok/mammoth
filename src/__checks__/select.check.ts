import {
  TableRow,
  arrayAgg,
  coalesce,
  count,
  defineDb,
  defineTable,
  integer,
  raw,
  star,
  sum,
  text,
  timestampWithTimeZone,
  uuid,
} from '../';

import { Query } from '../query';
import { ResultSet } from '../result-set';
import { expect, describe, test } from 'tstyche';

const toSnap = <T extends Query<any>>(query: T): ResultSet<T> => {
  return undefined as any;
};

const toTableRow = <T>(table: T): TableRow<T> => {
  return undefined as any;
};

const foo = defineTable({
  id: uuid().primaryKey().default(`gen_random_uuid()`),
  createDate: timestampWithTimeZone().notNull().default(`now()`),
  name: text().notNull(),
  value: integer(),
});

const bar = defineTable({
  id: uuid().primaryKey().default(`gen_random_uuid()`),
  startDate: timestampWithTimeZone().notNull().default(`now()`),
  endDate: timestampWithTimeZone().notNull().default(`now()`),
  value: integer(),
  fooId: uuid().references(foo, 'id'),
});

test('should output all columns and the data type', () => {
  expect(toTableRow(foo)).type.toEqual<{
    id: string;
    createDate: Date;
    name: string;
    value: number | null;
  }>();
});

const db = defineDb({ foo, bar }, () => Promise.resolve({ rows: [], affectedCount: 0 }));

describe('select', () => {
  test('should return null and not null properties', () => {
    expect(
      toSnap(db.select(db.foo.id, db.foo.createDate, db.foo.value).from(db.foo)),
    ).type.toEqual<{
      id: string;
      createDate: Date;
      value: number | null;
    }>();
  });

  test('should return nullable properties of left joined columns', () => {
    expect(
      toSnap(db.select(db.foo.id, db.bar.endDate, db.bar.value).from(db.foo).leftJoin(db.bar)),
    ).type.toEqual<{
      id: string;
      endDate: Date | null;
      value: number | null;
    }>();
  });

  test('should return nullable properties of left side properties when right joining', () => {
    expect(
      toSnap(db.select(db.foo.name, db.bar.startDate, db.bar.value).from(db.foo).rightJoin(db.bar)),
    ).type.toEqual<{
      value: number | null;
      name: string | null;
      startDate: Date;
    }>();
  });

  test('should select * and return nullable properties of left side properties when right joining', () => {
    expect(toSnap(db.select(star()).from(db.foo).rightJoin(db.bar))).type.toEqual<{
      id: string | null;
      createDate: Date | null;
      name: string | null;
      value: number | null;
      startDate: Date;
      endDate: Date;
      fooId: string | null;
    }>();
  });

  test('should select foo.* and ignore the rest', () => {
    expect(toSnap(db.select(star(db.foo)).from(db.foo).innerJoin(db.bar))).type.toEqual<{
      id: string;
      createDate: Date;
      name: string;
      value: number | null;
    }>();
  });

  test('should return renamed properties because of alias', () => {
    expect(
      toSnap(db.select(db.foo.name.as(`fooName`), db.foo.value.as(`fooValue`)).from(db.foo)),
    ).type.toEqual<{
      fooName: string;
      fooValue: number | null;
    }>();
  });

  test('should return nullable properties of all sides because of full join', () => {
    expect(
      toSnap(db.select(db.foo.name, db.bar.startDate, db.bar.value).from(db.foo).fullJoin(db.bar)),
    ).type.toEqual<{
      value: number | null;
      name: string | null;
      startDate: Date | null;
    }>;
  });

  test('should select expression', () => {
    expect(toSnap(db.select(db.foo.value.plus(1)).from(db.foo))).type.toEqual<{
      '?column?': number | null;
    }>();
  });

  test('should select named expression', () => {
    expect(toSnap(db.select(db.foo.value.plus(1).as(`test`)).from(db.foo))).type.toEqual<{
      test: number | null;
    }>();
  });

  test('should select aggregate subquery', () => {
    expect(
      toSnap(db.select(db.foo.id, db.select(count()).from(db.foo)).from(db.foo)),
    ).type.toEqual<{
      id: string;
      count: string;
    }>();
  });

  test('should select array_agg', () => {
    expect(toSnap(db.select(arrayAgg(db.foo.name)).from(db.foo))).type.toEqual<{
      arrayAgg: string[] | null;
    }>();
  });

  test('should select null column in subquery', () => {
    expect(
      toSnap(db.select(db.foo.id, db.select(db.foo.value).from(db.foo)).from(db.foo)),
    ).type.toEqual<{
      id: string;
      value: number | null;
    }>();
  });

  test('should select aggregate with alias', () => {
    expect(toSnap(db.select(db.foo.id, sum(db.foo.value).as(`total`)).from(db.foo))).type.toEqual<{
      id: string;
      total: number | null;
    }>();
  });

  test('should convert null value to not null using coalesce', () => {
    expect(toSnap(db.select(coalesce(db.foo.value, 1)).from(db.foo))).type.toEqual<{
      coalesce: number;
    }>();
  });

  test('should select foo.* from foo', () => {
    expect(toSnap(db.select(star(db.foo)).from(db.foo))).type.toEqual<{
      id: string;
      createDate: Date;
      name: string;
      value: number | null;
    }>();
  });

  test('should select * from foo', () => {
    expect(toSnap(db.select(star()).from(db.foo))).type.toEqual<{
      id: string;
      createDate: Date;
      name: string;
      value: number | null;
    }>();
  });

  test('should select * from foo left join bar', () => {
    expect(
      toSnap(db.select(star()).from(db.foo).leftJoin(db.bar).on(db.bar.fooId.eq(db.foo.id))),
    ).type.toEqual<{
      id: string;
      createDate: Date;
      name: string;
      value: number | null;
      startDate: Date | null;
      endDate: Date | null;
      fooId: string | null;
    }>();
  });

  test('should select * from foo right join bar', () => {
    expect(
      toSnap(db.select(star()).from(db.foo).rightJoin(db.bar).on(db.bar.fooId.eq(db.foo.id))),
    ).type.toEqual<{
      id: string | null;
      createDate: Date | null;
      name: string | null;
      value: number | null;
      startDate: Date;
      endDate: Date;
      fooId: string | null;
    }>();
  });

  test('should not use in with wrong data type', () => {
    expect(
      toSnap(
        db
          .select(db.foo.id)
          .from(db.foo)
          .where(db.foo.id.in(db.select(db.foo.createDate).from(db.foo))),
      ),
    ).type.toRaiseError();
  });

  test('with test as select from foo from test', async () => {
    expect(
      await db.with(
        `test`,
        () => db.select(db.foo.id, db.foo.createDate, db.foo.name, db.foo.value).from(db.foo),
        ({ test }) => db.select(test.id, test.createDate, test.name, test.value).from(test),
      ),
    ).type.toEqual<
      {
        id: string;
        createDate: Date;
        name: string;
        value: number | null;
      }[]
    >();
  });

  test('should select case with correct type and alias', () => {
    expect(
      toSnap(
        db
          .select(
            db
              .case()
              .when(db.foo.value.gt(100))
              .then('A' as const)
              .when(db.foo.value.gt(0))
              .then('B' as const)
              .else('C' as const)
              .end()
              .as(`bar`),
          )
          .from(db.foo),
      ),
    ).type.toEqual<{
      bar: 'A' | 'B' | 'C';
    }>();
  });

  test('should select and await result set', async () => {
    expect(await db.select(db.foo.id, db.foo.value).from(db.foo)).type.toEqual<
      {
        id: string;
        value: number | null;
      }[]
    >();
  });

  test('should select raw expression', () => {
    expect(
      toSnap(db.select(db.foo.id, raw<number, false, `test`>`test`).from(db.foo)),
    ).type.toEqual<{
      id: string;
      test: number | null;
    }>();
  });
});
