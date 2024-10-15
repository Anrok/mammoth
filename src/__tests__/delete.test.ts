import { defineDb, defineTable, integer, text, timestampWithTimeZone, uuid } from '..';

import { toSql } from '../sql-functions';

describe(`delete`, () => {
  const foo = defineTable({
    id: uuid().primaryKey().default(`gen_random_uuid()`),
    createDate: timestampWithTimeZone().notNull().default(`now()`),
    name: text().notNull(),
    value: integer(),
  });

  const bar = defineTable({
    id: uuid().primaryKey().default(`gen_random_uuid()`),
  });

  const baz = defineTable({
    id: uuid().primaryKey().default(`gen_random_uuid()`),
  });

  const db = defineDb(
    {
      foo,
      bar,
      baz,
    },
    () => Promise.resolve({ rows: [], affectedCount: 0 }),
  );

  it(`should delete from returning`, () => {
    const query = db
      .deleteFrom(db.foo)
      .using(db.bar, db.baz)
      .where(db.foo.id.ne(db.bar.id))
      .returning(`id`, `name`, `createDate`);

    expect(toSql(query)).toMatchInlineSnapshot(`
      {
        "parameters": [],
        "text": "DELETE FROM foo USING bar, baz WHERE foo.id <> bar.id RETURNING id, name, create_date "createDate"",
      }
    `);
  });

  it(`should delete from values list`, () => {
    const valuesList = db.values(
      'vals',
      {
        name: text().notNull(),
      },
      [{ name: 'foo' }],
    );

    const query = db.deleteFrom(db.foo).using(valuesList).where(db.foo.name.eq(valuesList.name));

    expect(toSql(query)).toMatchInlineSnapshot(`
      {
        "parameters": [
          "foo",
        ],
        "text": "DELETE FROM foo USING (VALUES ($1 :: text)) AS vals ("name") WHERE foo.name = vals.name",
      }
    `);
  });
});
