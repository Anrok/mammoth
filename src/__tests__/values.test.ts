import { defineDb, defineTable, integer, star, sum, text, toSql, uuid } from '..';

describe(`valuesList`, () => {
  const orderLog = defineTable({
    id: uuid().primaryKey().default(`gen_random_uuid()`),
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

  it(`should select from a values list`, () => {
    const valuesList = db.values(
      {
        id: text().notNull(),
        region: text().notNull(),
      },
      [
        {id: 'foo', region: 'aaa'},
        {id: 'bar', region: 'bbb'},
      ],
      'vals',
    );

    const query = db
      .select(
        valuesList.id,
        valuesList.region
      ).from(valuesList);

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          "foo",
          "aaa",
          "bar",
          "bbb",
        ],
        "text": "SELECT vals.id, vals.region FROM (VALUES ($1 :: text, $2 :: text), ($3, $4)) AS v (\\"id\\", \\"region\\")",
      }
    `);
  });

  it(`should join a values list`, () => {
    const valuesList = db.values(
      {
        region: text().notNull(),
        product: text().notNull(),
      },
      [
        {region: 'foo', product: 'aaa'},
        {region: 'bar', product: 'bbb'},
      ],
      'vals',
    );

    const query = db
      .select(
        db.orderLog.id,
      ).from(db.orderLog)
      .join(valuesList).on(
        db.orderLog.region.eq(valuesList.region)
        .and(db.orderLog.product.eq(valuesList.product))
      );

    expect(toSql(query)).toMatchInlineSnapshot(`
      Object {
        "parameters": Array [
          "foo",
          "aaa",
          "bar",
          "bbb",
        ],
        "text": "SELECT order_log.id FROM order_log JOIN (VALUES ($1 :: text, $2 :: text), ($3, $4)) AS v (\\"region\\", \\"product\\") ON (order_log.region = vals.region AND order_log.product = vals.product)",
      }
    `);
  });
});
