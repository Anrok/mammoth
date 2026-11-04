import {
  count,
  cumeDist,
  defineDb,
  defineTable,
  denseRank,
  firstValue,
  integer,
  lag,
  lastValue,
  lead,
  nthValue,
  ntile,
  percentRank,
  rank,
  rowNumber,
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

const transaction = defineTable({
  id: uuid().primaryKey().default(`gen_random_uuid()`),
  customerId: uuid().notNull(),
  amount: integer().notNull(),
  taxAmount: integer(),
  createdAt: timestampWithTimeZone().notNull().default(`now()`),
});

const db = defineDb({ transaction }, () => Promise.resolve({ rows: [], affectedCount: 0 }));

const byCustomer = {
  partitionBy: [db.transaction.customerId],
  orderBy: [db.transaction.createdAt.desc()],
};

describe('window functions', () => {
  test('ranking functions are not null', () => {
    expect(
      toSnap(
        db
          .select(
            rowNumber().over(byCustomer),
            rank().over(byCustomer),
            denseRank().over(byCustomer),
            percentRank().over(byCustomer),
            cumeDist().over(byCustomer),
            ntile(4).over(byCustomer),
          )
          .from(db.transaction),
      ),
    ).type.toBe<{
      rowNumber: string;
      rank: string;
      denseRank: string;
      percentRank: number;
      cumeDist: number;
      ntile: number;
    }>();
  });

  test('over() keeps the aggregate type and alias', () => {
    expect(
      toSnap(
        db
          .select(sum(db.transaction.amount).over(byCustomer).as(`runningTotal`), count().over())
          .from(db.transaction),
      ),
    ).type.toBe<{ runningTotal: number | null; count: string }>();
  });

  test('lag and lead are nullable unless a non-null default is given', () => {
    expect(
      toSnap(
        db
          .select(
            lag(db.transaction.amount).over(byCustomer).as(`previous`),
            lag(db.transaction.amount, 1, 0).over(byCustomer).as(`previousOrZero`),
            lead(db.transaction.taxAmount, 1, 0).over(byCustomer).as(`nextTaxOrZero`),
            lead(db.transaction.amount, 1, db.transaction.amount).over(byCustomer).as(`nextOrSelf`),
          )
          .from(db.transaction),
      ),
    ).type.toBe<{
      previous: number | null;
      previousOrZero: number;
      nextTaxOrZero: number | null;
      nextOrSelf: number;
    }>();
  });

  test('frame value functions are nullable', () => {
    expect(
      toSnap(
        db
          .select(
            firstValue(db.transaction.amount).over(byCustomer),
            lastValue(db.transaction.amount).over(byCustomer),
            nthValue(db.transaction.amount, 2).over(byCustomer),
          )
          .from(db.transaction),
      ),
    ).type.toBe<{ firstValue: number | null; lastValue: number | null; nthValue: number | null }>();
  });

  test('lag default must match the value type', () => {
    expect(lag).type.not.toBeCallableWith(db.transaction.amount, 1, `zero`);
  });

  test('frame bounds only accept valid start and end positions', () => {
    expect(rowNumber().over).type.not.toBeCallableWith({
      frame: { mode: 'ROWS', start: 'UNBOUNDED FOLLOWING' },
    });
    expect(rowNumber().over).type.not.toBeCallableWith({
      frame: { mode: 'ROWS', start: 'CURRENT ROW', end: 'UNBOUNDED PRECEDING' },
    });
    expect(rowNumber().over).type.toBeCallableWith({
      frame: { mode: 'GROUPS', start: 'UNBOUNDED PRECEDING', end: 'UNBOUNDED FOLLOWING' },
    });
  });

  test('over() only accepts a window name or definition', () => {
    expect(rowNumber().over).type.not.toBeCallableWith(42);
    expect(rowNumber().over).type.toBeCallableWith({
      frame: { mode: 'ROWS', start: { preceding: 2 } },
    });
    expect(rowNumber().over).type.not.toBeCallableWith({
      frame: { mode: 'ROW', start: 'CURRENT ROW' },
    });
  });
});
