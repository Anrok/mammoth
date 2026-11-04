import { toSql } from '../sql-functions';
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
} from '..';

describe(`window functions`, () => {
  const transaction = defineTable({
    id: uuid().primaryKey().default(`gen_random_uuid()`),
    customerId: uuid().notNull(),
    jurisdiction: text().notNull(),
    amount: integer().notNull(),
    taxAmount: integer(),
    createdAt: timestampWithTimeZone().notNull().default(`now()`),
  });

  const db = defineDb({ transaction }, () => Promise.resolve({ rows: [], affectedCount: 0 }));

  it(`should select row_number over a partition`, () => {
    const query = db
      .select(
        db.transaction.id,
        rowNumber().over({
          partitionBy: [db.transaction.customerId],
          orderBy: [db.transaction.createdAt.desc()],
        }),
      )
      .from(db.transaction);

    expect(toSql(query)).toMatchInlineSnapshot(`
     {
       "parameters": [],
       "text": "SELECT transaction.id, row_number () OVER (PARTITION BY transaction.customer_id ORDER BY transaction.created_at DESC) "rowNumber" FROM transaction",
     }
    `);
  });

  it(`should support an empty OVER () on aggregates`, () => {
    const query = db
      .select(db.transaction.id, sum(db.transaction.amount).over(), count().over())
      .from(db.transaction);

    expect(toSql(query)).toMatchInlineSnapshot(`
     {
       "parameters": [],
       "text": "SELECT transaction.id, SUM (transaction.amount) OVER (), COUNT(*) OVER () FROM transaction",
     }
    `);
  });

  it(`should alias a window function call`, () => {
    const query = db
      .select(
        sum(db.transaction.amount)
          .over({ partitionBy: [db.transaction.jurisdiction, db.transaction.customerId] })
          .as(`jurisdictionTotal`),
      )
      .from(db.transaction);

    expect(toSql(query)).toMatchInlineSnapshot(`
     {
       "parameters": [],
       "text": "SELECT (SUM (transaction.amount) OVER (PARTITION BY transaction.jurisdiction, transaction.customer_id)) "jurisdictionTotal" FROM transaction",
     }
    `);
  });

  it(`should define named windows and reference them`, () => {
    const query = db
      .select(
        db.transaction.id,
        rank().over(`byAmount`),
        denseRank().over(`byAmount`),
        percentRank().over(`byAmount`),
        cumeDist().over(`byAmount`),
        sum(db.transaction.amount).over(`recent`),
      )
      .from(db.transaction)
      .window({
        byAmount: {
          partitionBy: [db.transaction.jurisdiction],
          orderBy: [db.transaction.amount.desc()],
        },
        recent: { orderBy: [db.transaction.createdAt] },
      });

    expect(toSql(query)).toMatchInlineSnapshot(`
     {
       "parameters": [],
       "text": "SELECT transaction.id, rank () OVER "byAmount", dense_rank () OVER "byAmount" "denseRank", percent_rank () OVER "byAmount" "percentRank", cume_dist () OVER "byAmount" "cumeDist", SUM (transaction.amount) OVER recent FROM transaction WINDOW "byAmount" AS (PARTITION BY transaction.jurisdiction ORDER BY transaction.amount DESC), recent AS (ORDER BY transaction.created_at)",
     }
    `);
  });

  it(`should refine an existing window`, () => {
    const query = db
      .select(
        sum(db.transaction.amount).over({
          existingWindow: `perCustomer`,
          orderBy: [db.transaction.createdAt],
        }),
      )
      .from(db.transaction)
      .where(db.transaction.amount.gt(0))
      .window({ perCustomer: { partitionBy: [db.transaction.customerId] } })
      .orderBy(db.transaction.createdAt)
      .limit(10);

    expect(toSql(query)).toMatchInlineSnapshot(`
     {
       "parameters": [
         0,
         10,
       ],
       "text": "SELECT SUM (transaction.amount) OVER ("perCustomer" ORDER BY transaction.created_at) FROM transaction WHERE transaction.amount > $1 WINDOW "perCustomer" AS (PARTITION BY transaction.customer_id) ORDER BY transaction.created_at LIMIT $2",
     }
    `);
  });

  it(`should support frame clauses`, () => {
    const query = db
      .select(
        sum(db.transaction.amount)
          .over({
            partitionBy: [db.transaction.customerId],
            orderBy: [db.transaction.createdAt],
            frame: { mode: `ROWS`, start: { preceding: 6 }, end: `CURRENT ROW` },
          })
          .as(`rollingWeek`),
        sum(db.transaction.amount)
          .over({
            orderBy: [db.transaction.createdAt],
            frame: {
              mode: `GROUPS`,
              start: `UNBOUNDED PRECEDING`,
              end: { following: 1 },
              exclude: `TIES`,
            },
          })
          .as(`runningGroups`),
        sum(db.transaction.amount)
          .over({ frame: { mode: `RANGE`, start: `UNBOUNDED PRECEDING` } })
          .as(`runningRange`),
      )
      .from(db.transaction);

    expect(toSql(query)).toMatchInlineSnapshot(`
     {
       "parameters": [],
       "text": "SELECT (SUM (transaction.amount) OVER (PARTITION BY transaction.customer_id ORDER BY transaction.created_at ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)) "rollingWeek", (SUM (transaction.amount) OVER (ORDER BY transaction.created_at GROUPS BETWEEN UNBOUNDED PRECEDING AND 1 FOLLOWING EXCLUDE TIES)) "runningGroups", (SUM (transaction.amount) OVER (RANGE UNBOUNDED PRECEDING)) "runningRange" FROM transaction",
     }
    `);
  });

  it(`should select lag and lead with offsets and defaults`, () => {
    const window = {
      partitionBy: [db.transaction.customerId],
      orderBy: [db.transaction.createdAt],
    };
    const query = db
      .select(
        lag(db.transaction.amount).over(window).as(`previousAmount`),
        lag(db.transaction.amount, 2, 0).over(window).as(`twoBackOrZero`),
        lead(db.transaction.amount, 1, db.transaction.amount).over(window).as(`nextOrSelf`),
        lead(db.transaction.createdAt, 3).over(window).as(`thirdNext`),
      )
      .from(db.transaction);

    expect(toSql(query)).toMatchInlineSnapshot(`
      {
        "parameters": [
          2,
          0,
          1,
          3,
        ],
        "text": "SELECT (lag (transaction.amount) OVER (PARTITION BY transaction.customer_id ORDER BY transaction.created_at)) "previousAmount", (lag (transaction.amount, $1, $2) OVER (PARTITION BY transaction.customer_id ORDER BY transaction.created_at)) "twoBackOrZero", (lead (transaction.amount, $3, transaction.amount) OVER (PARTITION BY transaction.customer_id ORDER BY transaction.created_at)) "nextOrSelf", (lead (transaction.created_at, $4) OVER (PARTITION BY transaction.customer_id ORDER BY transaction.created_at)) "thirdNext" FROM transaction",
      }
    `);
  });

  it(`should select ntile, first_value, last_value and nth_value`, () => {
    const window = { orderBy: [db.transaction.amount] };
    const query = db
      .select(
        ntile(4).over(window).as(`quartile`),
        firstValue(db.transaction.amount).over(window),
        lastValue(db.transaction.amount).over(window),
        nthValue(db.transaction.amount, 2).over(window),
      )
      .from(db.transaction);

    expect(toSql(query)).toMatchInlineSnapshot(`
      {
        "parameters": [
          4,
          2,
        ],
        "text": "SELECT (ntile ($1) OVER (ORDER BY transaction.amount)) quartile, first_value (transaction.amount) OVER (ORDER BY transaction.amount) "firstValue", last_value (transaction.amount) OVER (ORDER BY transaction.amount) "lastValue", nth_value (transaction.amount, $2) OVER (ORDER BY transaction.amount) "nthValue" FROM transaction",
      }
    `);
  });

  it(`should select the latest row per customer through a subquery`, () => {
    const ranked = db
      .select(
        db.transaction.id,
        db.transaction.customerId,
        rowNumber()
          .over({
            partitionBy: [db.transaction.customerId],
            orderBy: [db.transaction.createdAt.desc()],
          })
          .as(`position`),
      )
      .from(db.transaction)
      .as(`ranked`);

    const query = db
      .select(ranked.id, ranked.customerId)
      .from(ranked)
      .where(ranked.position.eq(`1`));

    expect(toSql(query)).toMatchInlineSnapshot(`
     {
       "parameters": [
         "1",
       ],
       "text": "SELECT ranked.id, ranked."customerId" "customerId" FROM (SELECT transaction.id, transaction.customer_id "customerId", (row_number () OVER (PARTITION BY transaction.customer_id ORDER BY transaction.created_at DESC)) "position" FROM transaction) AS ranked WHERE ranked.position = $1",
     }
    `);
  });

  it(`should reject invalid window names`, () => {
    expect(() => rowNumber().over(`bad name; DROP TABLE x`)).toThrow(/Invalid window name/);
    expect(() => db.select(db.transaction.id).from(db.transaction).window({ 'w"': {} })).toThrow(
      /Invalid window name/,
    );
  });

  it(`should reject invalid frame offsets`, () => {
    expect(() =>
      sum(db.transaction.amount).over({ frame: { mode: `ROWS`, start: { preceding: -1 } } }),
    ).toThrow(/non-negative integer/);
    expect(() =>
      sum(db.transaction.amount).over({ frame: { mode: `ROWS`, start: { following: 1.5 } } }),
    ).toThrow(/non-negative integer/);
  });

  it(`should reject an empty WINDOW clause`, () => {
    expect(() => db.select(db.transaction.id).from(db.transaction).window({})).toThrow(
      /at least one window definition/,
    );
  });
});
