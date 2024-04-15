import { defineDb, defineTable, integer, text, timestampWithTimeZone, toSql, uuid } from '..';

describe(`update`, () => {
  const foo = defineTable({
    id: uuid().primaryKey().default(`gen_random_uuid()`),
    createDate: timestampWithTimeZone().notNull().default(`now()`),
    name: text().notNull(),
    value: integer(),
  });

  const bar = defineTable({
    id: uuid().primaryKey().default(`gen_random_uuid()`),
    fooId: uuid().notNull().references(foo, `id`),
    name: text(),
    with: text(),
  });

  const db = defineDb({ foo, bar }, () => Promise.resolve({ rows: [], affectedCount: 0 }));

  it(`should update foo`, () => {
    const query = db
      .update(db.foo)
      .set({ name: `Test` })
      .where(db.foo.value.isNull())
      .returning(`id`, `createDate`);

    expect(toSql(query)).toMatchInlineSnapshot(`
      {
        "parameters": [
          "Test",
        ],
        "text": "UPDATE foo SET name = $1 WHERE foo.value IS NULL RETURNING id, create_date "createDate"",
      }
    `);
  });

  it(`should update-from foo`, () => {
    const query = db
      .update(db.foo)
      .set({ name: `Test` })
      .from(db.bar)
      .where(db.bar.fooId.eq(db.foo.id).and(db.bar.name.isNotNull()));

    expect(toSql(query)).toMatchInlineSnapshot(`
      {
        "parameters": [
          "Test",
        ],
        "text": "UPDATE foo SET name = $1 FROM bar WHERE bar.foo_id = foo.id AND bar.name IS NOT NULL",
      }
    `);
  });

  it(`should update-from foo with reserved keyword alias`, () => {
    const test = db.bar.as('user');
    const query = db
      .update(db.foo)
      .set({ name: `Test` })
      .from(test)
      .where(test.fooId.eq(db.foo.id).and(test.name.isNotNull()));

    expect(toSql(query)).toMatchInlineSnapshot(`
      {
        "parameters": [
          "Test",
        ],
        "text": "UPDATE foo SET name = $1 FROM bar "user" WHERE "user".foo_id = foo.id AND "user".name IS NOT NULL",
      }
    `);
  });

  it(`should update where current of foo`, () => {
    const query = db.update(db.foo).set({ name: `Test` }).whereCurrentOf(`cursor1`);

    expect(toSql(query)).toMatchInlineSnapshot(`
      {
        "parameters": [
          "Test",
          "cursor1",
        ],
        "text": "UPDATE foo SET name = $1 WHERE CURRENT OF $2",
      }
    `);
  });

  it(`should update reserved keyword column`, () => {
    const query = db.update(db.bar).set({ with: `Test` });

    expect(toSql(query)).toMatchInlineSnapshot(`
      {
        "parameters": [
          "Test",
        ],
        "text": "UPDATE bar SET "with" = $1",
      }
    `);
  });
});
