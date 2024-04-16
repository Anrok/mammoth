import { defineDb, defineTable, integer, text, timestamp, toSql } from '..';

describe(`valuesList`, () => {
  const orderLog = defineTable({
    id: integer().notNull().primaryKey(),
    region: text().notNull(),
    product: text().notNull(),
    quantity: integer().notNull(),
    amount: integer().notNull(),
    createDate: timestamp().notNull(),
  });

  const db = defineDb(
    {
      orderLog,
    },
    () => Promise.resolve({ rows: [], affectedCount: 0 }),
  );

  const valuesList = db.values(
    'vals',
    {
      id: integer().notNull(),
      product: text().notNull(),
      fooId: text(),
    },
    [
      { id: 1, product: 'foo', fooId: 'a1' },
      { id: 2, product: 'bar', fooId: null },
    ],
  );

  test('should select star from values list', () => {
    const query = db.select(db.star()).from(valuesList);

    expect(toSql(query)).toMatchInlineSnapshot(`
      {
        "parameters": [
          1,
          "foo",
          "a1",
          2,
          "bar",
          null,
        ],
        "text": "SELECT vals.id, vals.product, vals.foo_id "fooId" FROM (VALUES ($1 :: integer, $2 :: text, $3 :: text), ($4, $5, $6)) AS vals ("id", "product", "foo_id")",
      }
    `);
  });

  test('should select star from values list with alias', () => {
    const query = db.select(db.star()).from(valuesList.as('test'));

    expect(toSql(query)).toMatchInlineSnapshot(`
      {
        "parameters": [
          1,
          "foo",
          "a1",
          2,
          "bar",
          null,
        ],
        "text": "SELECT test.id, test.product, test.foo_id "fooId" FROM (VALUES ($1 :: integer, $2 :: text, $3 :: text), ($4, $5, $6)) AS test ("id", "product", "foo_id")",
      }
    `);
  });

  it('should select from a values list with single row', () => {
    const query = db.select(db.star()).from(
      db.values(
        'logs',
        {
          id: integer().notNull(),
          region: text().notNull(),
        },
        [{ id: 1, region: 'foo' }],
      ),
    );

    expect(toSql(query)).toMatchInlineSnapshot(`
      {
        "parameters": [
          1,
          "foo",
        ],
        "text": "SELECT logs.id, logs.region FROM (VALUES ($1 :: integer, $2 :: text)) AS logs ("id", "region")",
      }
    `);
  });

  it(`should select from a values list with multiple rows`, () => {
    const query = db.select(valuesList.id, valuesList.product).from(valuesList);

    expect(toSql(query)).toMatchInlineSnapshot(`
      {
        "parameters": [
          1,
          "foo",
          "a1",
          2,
          "bar",
          null,
        ],
        "text": "SELECT vals.id, vals.product FROM (VALUES ($1 :: integer, $2 :: text, $3 :: text), ($4, $5, $6)) AS vals ("id", "product", "foo_id")",
      }
    `);
  });

  it(`should join a values list`, () => {
    const query = db
      .select(db.orderLog.id)
      .from(db.orderLog)
      .join(valuesList)
      .on(db.orderLog.id.eq(valuesList.id).and(db.orderLog.product.eq(valuesList.product)));

    expect(toSql(query)).toMatchInlineSnapshot(`
      {
        "parameters": [
          1,
          "foo",
          "a1",
          2,
          "bar",
          null,
        ],
        "text": "SELECT order_log.id FROM order_log JOIN (VALUES ($1 :: integer, $2 :: text, $3 :: text), ($4, $5, $6)) AS vals ("id", "product", "foo_id") ON (order_log.id = vals.id AND order_log.product = vals.product)",
      }
    `);
  });

  it(`should inner join a values list`, () => {
    const query = db
      .select(db.orderLog.id)
      .from(db.orderLog)
      .innerJoin(valuesList)
      .on(db.orderLog.id.eq(valuesList.id).and(db.orderLog.product.eq(valuesList.product)));

    expect(toSql(query)).toMatchInlineSnapshot(`
      {
        "parameters": [
          1,
          "foo",
          "a1",
          2,
          "bar",
          null,
        ],
        "text": "SELECT order_log.id FROM order_log INNER JOIN (VALUES ($1 :: integer, $2 :: text, $3 :: text), ($4, $5, $6)) AS vals ("id", "product", "foo_id") ON (order_log.id = vals.id AND order_log.product = vals.product)",
      }
    `);
  });

  it(`should left outer join a values list`, () => {
    const query = db
      .select(db.orderLog.id)
      .from(db.orderLog)
      .leftOuterJoin(valuesList)
      .on(db.orderLog.id.eq(valuesList.id).and(db.orderLog.product.eq(valuesList.product)));

    expect(toSql(query)).toMatchInlineSnapshot(`
      {
        "parameters": [
          1,
          "foo",
          "a1",
          2,
          "bar",
          null,
        ],
        "text": "SELECT order_log.id FROM order_log LEFT OUTER JOIN (VALUES ($1 :: integer, $2 :: text, $3 :: text), ($4, $5, $6)) AS vals ("id", "product", "foo_id") ON (order_log.id = vals.id AND order_log.product = vals.product)",
      }
    `);
  });

  it(`should left join a values list`, () => {
    const query = db
      .select(db.orderLog.id)
      .from(db.orderLog)
      .leftJoin(valuesList)
      .on(db.orderLog.id.eq(valuesList.id).and(db.orderLog.product.eq(valuesList.product)));

    expect(toSql(query)).toMatchInlineSnapshot(`
      {
        "parameters": [
          1,
          "foo",
          "a1",
          2,
          "bar",
          null,
        ],
        "text": "SELECT order_log.id FROM order_log LEFT JOIN (VALUES ($1 :: integer, $2 :: text, $3 :: text), ($4, $5, $6)) AS vals ("id", "product", "foo_id") ON (order_log.id = vals.id AND order_log.product = vals.product)",
      }
    `);
  });

  it(`should right outer join a values list`, () => {
    const query = db
      .select(db.orderLog.id)
      .from(db.orderLog)
      .rightOuterJoin(valuesList)
      .on(db.orderLog.id.eq(valuesList.id).and(db.orderLog.product.eq(valuesList.product)));

    expect(toSql(query)).toMatchInlineSnapshot(`
      {
        "parameters": [
          1,
          "foo",
          "a1",
          2,
          "bar",
          null,
        ],
        "text": "SELECT order_log.id FROM order_log RIGHT OUTER JOIN (VALUES ($1 :: integer, $2 :: text, $3 :: text), ($4, $5, $6)) AS vals ("id", "product", "foo_id") ON (order_log.id = vals.id AND order_log.product = vals.product)",
      }
    `);
  });

  it(`should inner join a values list`, () => {
    const query = db
      .select(db.orderLog.id)
      .from(db.orderLog)
      .innerJoin(valuesList)
      .on(db.orderLog.id.eq(valuesList.id).and(db.orderLog.product.eq(valuesList.product)));

    expect(toSql(query)).toMatchInlineSnapshot(`
      {
        "parameters": [
          1,
          "foo",
          "a1",
          2,
          "bar",
          null,
        ],
        "text": "SELECT order_log.id FROM order_log INNER JOIN (VALUES ($1 :: integer, $2 :: text, $3 :: text), ($4, $5, $6)) AS vals ("id", "product", "foo_id") ON (order_log.id = vals.id AND order_log.product = vals.product)",
      }
    `);
  });

  it(`should right join a values list`, () => {
    const query = db
      .select(db.orderLog.id)
      .from(db.orderLog)
      .rightJoin(valuesList)
      .on(db.orderLog.id.eq(valuesList.id).and(db.orderLog.product.eq(valuesList.product)));

    expect(toSql(query)).toMatchInlineSnapshot(`
      {
        "parameters": [
          1,
          "foo",
          "a1",
          2,
          "bar",
          null,
        ],
        "text": "SELECT order_log.id FROM order_log RIGHT JOIN (VALUES ($1 :: integer, $2 :: text, $3 :: text), ($4, $5, $6)) AS vals ("id", "product", "foo_id") ON (order_log.id = vals.id AND order_log.product = vals.product)",
      }
    `);
  });

  it(`should full outer join a values list`, () => {
    const query = db
      .select(db.orderLog.id)
      .from(db.orderLog)
      .fullOuterJoin(valuesList)
      .on(db.orderLog.id.eq(valuesList.id).and(db.orderLog.product.eq(valuesList.product)));

    expect(toSql(query)).toMatchInlineSnapshot(`
      {
        "parameters": [
          1,
          "foo",
          "a1",
          2,
          "bar",
          null,
        ],
        "text": "SELECT order_log.id FROM order_log FULL OUTER JOIN (VALUES ($1 :: integer, $2 :: text, $3 :: text), ($4, $5, $6)) AS vals ("id", "product", "foo_id") ON (order_log.id = vals.id AND order_log.product = vals.product)",
      }
    `);
  });

  it(`should full join a values list`, () => {
    const query = db
      .select(db.orderLog.id)
      .from(db.orderLog)
      .fullJoin(valuesList)
      .on(db.orderLog.id.eq(valuesList.id).and(db.orderLog.product.eq(valuesList.product)));

    expect(toSql(query)).toMatchInlineSnapshot(`
      {
        "parameters": [
          1,
          "foo",
          "a1",
          2,
          "bar",
          null,
        ],
        "text": "SELECT order_log.id FROM order_log FULL JOIN (VALUES ($1 :: integer, $2 :: text, $3 :: text), ($4, $5, $6)) AS vals ("id", "product", "foo_id") ON (order_log.id = vals.id AND order_log.product = vals.product)",
      }
    `);
  });

  it(`should cross join a values list`, () => {
    const query = db
      .select(db.orderLog.id)
      .from(db.orderLog)
      .crossJoin(valuesList)
      .on(db.orderLog.id.eq(valuesList.id).and(db.orderLog.product.eq(valuesList.product)));

    expect(toSql(query)).toMatchInlineSnapshot(`
      {
        "parameters": [
          1,
          "foo",
          "a1",
          2,
          "bar",
          null,
        ],
        "text": "SELECT order_log.id FROM order_log CROSS JOIN (VALUES ($1 :: integer, $2 :: text, $3 :: text), ($4, $5, $6)) AS vals ("id", "product", "foo_id") ON (order_log.id = vals.id AND order_log.product = vals.product)",
      }
    `);
  });

  it('should select from with values list', () => {
    const query = db.with(
      'test',
      () => db.select(db.star()).from(valuesList),
      ({ test }) => db.select(db.star()).from(test),
    );

    expect(toSql(query)).toMatchInlineSnapshot(`
      {
        "parameters": [
          1,
          "foo",
          "a1",
          2,
          "bar",
          null,
        ],
        "text": "WITH test AS (SELECT vals.id, vals.product, vals.foo_id "fooId" FROM (VALUES ($1 :: integer, $2 :: text, $3 :: text), ($4, $5, $6)) AS vals ("id", "product", "foo_id")) SELECT test.id, test.product, test."fooId" "fooId" FROM test",
      }
    `);
  });
});
