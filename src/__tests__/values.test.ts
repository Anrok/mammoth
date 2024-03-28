import { defineDb, defineTable, integer, text, toSql } from '..';

describe(`valuesList`, () => {
  const orderLog = defineTable({
    id: integer().notNull().primaryKey(),
    region: text().notNull(),
    product: text().notNull(),
    quantity: integer().notNull(),
    amount: integer().notNull(),
  });

  const db = defineDb(
    {
      orderLog,
    },
    () => Promise.resolve({ rows: [], affectedCount: 0 }),
  );

  const valuesList = db.values(
    {
      id: integer().notNull(),
      product: text().notNull(),
    },
    [
      {id: 1, product: 'foo'},
      {id: 2, product: 'bar'},
    ],
    'vals',
  );

  test('should select star from values list', () => {
    const query = db
      .select(db.star())
      .from(valuesList);

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          1,
          "foo",
          2,
          "bar",
        ],
        "text": "SELECT vals.id, vals.product FROM (VALUES ($1 :: integer, $2 :: text), ($3, $4)) AS vals (\\"id\\", \\"product\\")",
      }
    `);
  });

  test('should select star from values list with alias', () => {
    const query = db
      .select(db.star())
      .from(valuesList.as('test'));

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          1,
          "foo",
          2,
          "bar",
        ],
        "text": "SELECT test.id, test.product FROM (VALUES ($1 :: integer, $2 :: text), ($3, $4)) AS test (\\"id\\", \\"product\\")",
      }
    `);
  });

  it('should select from a values list with single row', () => {
    const query = db
      .select(db.star())
      .from(db.values(
        {id: integer().notNull(), region: text().notNull()},
        [{id: 1, region: 'foo'}],
        'logs',
      ));

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          1,
          "foo",
        ],
        "text": "SELECT logs.id, logs.region FROM (VALUES ($1 :: integer, $2 :: text)) AS logs (\\"id\\", \\"region\\")",
      }
    `);
  });

  it(`should select from a values list with multiple rows`, () => {
    const query = db
      .select(
        valuesList.id,
        valuesList.product
      )
      .from(valuesList);

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          1,
          "foo",
          2,
          "bar",
        ],
        "text": "SELECT vals.id, vals.product FROM (VALUES ($1 :: integer, $2 :: text), ($3, $4)) AS vals (\\"id\\", \\"product\\")",
      }
    `);
  });

  it(`should join a values list`, () => {
    const query = db
      .select(db.orderLog.id)
      .from(db.orderLog)
      .join(valuesList).on(
        db.orderLog.id.eq(valuesList.id)
        .and(db.orderLog.product.eq(valuesList.product))
      );

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          1,
          "foo",
          2,
          "bar",
        ],
        "text": "SELECT order_log.id FROM order_log JOIN (VALUES ($1 :: integer, $2 :: text), ($3, $4)) AS vals (\\"id\\", \\"product\\") ON (order_log.id = vals.id AND order_log.product = vals.product)",
      }
    `);
  });

  it(`should inner join a values list`, () => {
    const query = db
      .select(db.orderLog.id)
      .from(db.orderLog)
      .innerJoin(valuesList).on(
        db.orderLog.id.eq(valuesList.id)
        .and(db.orderLog.product.eq(valuesList.product))
      );

      expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          1,
          "foo",
          2,
          "bar",
        ],
        "text": "SELECT order_log.id FROM order_log INNER JOIN (VALUES ($1 :: integer, $2 :: text), ($3, $4)) AS vals (\\"id\\", \\"product\\") ON (order_log.id = vals.id AND order_log.product = vals.product)",
      }
    `);
  });

  it(`should left outer join a values list`, () => {
    const query = db
      .select(db.orderLog.id)
      .from(db.orderLog)
      .leftOuterJoin(valuesList).on(
        db.orderLog.id.eq(valuesList.id)
        .and(db.orderLog.product.eq(valuesList.product))
      );

      expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          1,
          "foo",
          2,
          "bar",
        ],
        "text": "SELECT order_log.id FROM order_log LEFT OUTER JOIN (VALUES ($1 :: integer, $2 :: text), ($3, $4)) AS vals (\\"id\\", \\"product\\") ON (order_log.id = vals.id AND order_log.product = vals.product)",
      }
    `);
  });

  it(`should left join a values list`, () => {
    const query = db
      .select(db.orderLog.id)
      .from(db.orderLog)
      .leftJoin(valuesList).on(
        db.orderLog.id.eq(valuesList.id)
        .and(db.orderLog.product.eq(valuesList.product))
      );

      expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          1,
          "foo",
          2,
          "bar",
        ],
        "text": "SELECT order_log.id FROM order_log LEFT JOIN (VALUES ($1 :: integer, $2 :: text), ($3, $4)) AS vals (\\"id\\", \\"product\\") ON (order_log.id = vals.id AND order_log.product = vals.product)",
      }
    `);
  });

  it(`should right outer join a values list`, () => {
    const query = db
      .select(db.orderLog.id)
      .from(db.orderLog)
      .rightOuterJoin(valuesList).on(
        db.orderLog.id.eq(valuesList.id)
        .and(db.orderLog.product.eq(valuesList.product))
      );

      expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          1,
          "foo",
          2,
          "bar",
        ],
        "text": "SELECT order_log.id FROM order_log RIGHT OUTER JOIN (VALUES ($1 :: integer, $2 :: text), ($3, $4)) AS vals (\\"id\\", \\"product\\") ON (order_log.id = vals.id AND order_log.product = vals.product)",
      }
    `);
  });

  it(`should inner join a values list`, () => {
    const query = db
      .select(db.orderLog.id)
      .from(db.orderLog)
      .innerJoin(valuesList).on(
        db.orderLog.id.eq(valuesList.id)
        .and(db.orderLog.product.eq(valuesList.product))
      );

      expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          1,
          "foo",
          2,
          "bar",
        ],
        "text": "SELECT order_log.id FROM order_log INNER JOIN (VALUES ($1 :: integer, $2 :: text), ($3, $4)) AS vals (\\"id\\", \\"product\\") ON (order_log.id = vals.id AND order_log.product = vals.product)",
      }
    `);
  });

  it(`should right join a values list`, () => {
    const query = db
      .select(db.orderLog.id)
      .from(db.orderLog)
      .rightJoin(valuesList).on(
        db.orderLog.id.eq(valuesList.id)
        .and(db.orderLog.product.eq(valuesList.product))
      );

      expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          1,
          "foo",
          2,
          "bar",
        ],
        "text": "SELECT order_log.id FROM order_log RIGHT JOIN (VALUES ($1 :: integer, $2 :: text), ($3, $4)) AS vals (\\"id\\", \\"product\\") ON (order_log.id = vals.id AND order_log.product = vals.product)",
      }
    `);
  });

  it(`should full outer join a values list`, () => {
    const query = db
      .select(db.orderLog.id)
      .from(db.orderLog)
      .fullOuterJoin(valuesList).on(
        db.orderLog.id.eq(valuesList.id)
        .and(db.orderLog.product.eq(valuesList.product))
      );

      expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          1,
          "foo",
          2,
          "bar",
        ],
        "text": "SELECT order_log.id FROM order_log FULL OUTER JOIN (VALUES ($1 :: integer, $2 :: text), ($3, $4)) AS vals (\\"id\\", \\"product\\") ON (order_log.id = vals.id AND order_log.product = vals.product)",
      }
    `);
  });


  it(`should full join a values list`, () => {
    const query = db
      .select(db.orderLog.id)
      .from(db.orderLog)
      .fullJoin(valuesList).on(
        db.orderLog.id.eq(valuesList.id)
        .and(db.orderLog.product.eq(valuesList.product))
      );

      expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          1,
          "foo",
          2,
          "bar",
        ],
        "text": "SELECT order_log.id FROM order_log FULL JOIN (VALUES ($1 :: integer, $2 :: text), ($3, $4)) AS vals (\\"id\\", \\"product\\") ON (order_log.id = vals.id AND order_log.product = vals.product)",
      }
    `);
  });

  it(`should cross join a values list`, () => {
    const query = db
      .select(db.orderLog.id)
      .from(db.orderLog)
      .crossJoin(valuesList).on(
        db.orderLog.id.eq(valuesList.id)
        .and(db.orderLog.product.eq(valuesList.product))
      );

      expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          1,
          "foo",
          2,
          "bar",
        ],
        "text": "SELECT order_log.id FROM order_log CROSS JOIN (VALUES ($1 :: integer, $2 :: text), ($3, $4)) AS vals (\\"id\\", \\"product\\") ON (order_log.id = vals.id AND order_log.product = vals.product)",
      }
    `);
  });
});
