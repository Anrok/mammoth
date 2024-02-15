import { defineDb, defineTable, integer, star, text, timestampWithTimeZone, uuid } from '..';

describe(`execute`, () => {
  const foo = defineTable({
    id: uuid().primaryKey().default(`gen_random_uuid()`),
    createDate: timestampWithTimeZone().notNull().default(`now()`),
    name: text().notNull(),
    value: integer(),
  });

  const db = defineDb({ foo }, () =>
    Promise.resolve({ rows: [{ a: `1` }, { b: `2` }], affectedCount: 123 }),
  );

  it(`select should return rows`, async () => {
    const rows = await db.select(db.foo.id).from(db.foo);

    expect(rows).toMatchInlineSnapshot(`
      Array [
        Object {
          "a": "1",
        },
        Object {
          "b": "2",
        },
      ]
    `);
  });

  it(`update should return count`, async () => {
    const count = await db.update(db.foo).set({ name: `Test` });

    expect(count).toMatchInlineSnapshot(`123`);
  });

  it(`update with returning should return rows`, async () => {
    const rows = await db.update(db.foo).set({ name: `Test` }).returning(`id`);

    expect(rows).toMatchInlineSnapshot(`
      Array [
        Object {
          "a": "1",
        },
        Object {
          "b": "2",
        },
      ]
    `);
  });

  it(`delete should return count`, async () => {
    const count = await db.deleteFrom(db.foo);

    expect(count).toMatchInlineSnapshot(`123`);
  });

  it(`delete with returning should return rows`, async () => {
    const rows = await db.deleteFrom(db.foo).returning(`id`);

    expect(rows).toMatchInlineSnapshot(`
      Array [
        Object {
          "a": "1",
        },
        Object {
          "b": "2",
        },
      ]
    `);
  });

  it(`insert should return count`, async () => {
    const count = await db.insertInto(db.foo).defaultValues();

    expect(count).toMatchInlineSnapshot(`123`);
  });

  it(`insert with returning should return rows`, async () => {
    const rows = await db.insertInto(db.foo).defaultValues().returning(`id`);

    expect(rows).toMatchInlineSnapshot(`
      Array [
        Object {
          "a": "1",
        },
        Object {
          "b": "2",
        },
      ]
    `);
  });

  it('with update query should return count', async () => {
    const count = await db.with(
      `test`,
      () => db.select(star(db.foo)).from(db.foo),
      ({ test }) => db.update(db.foo).set({ name: 'foo' }).from(test).where(db.foo.id.eq(test.id)),
    );

    expect(count).toMatchInlineSnapshot(`123`);
  });

  it('with delete query should return count', async () => {
    const count = await db.with(
      `test`,
      () => db.select(star(db.foo)).from(db.foo),
      ({ test }) => db.deleteFrom(db.foo).using(test).where(db.foo.id.eq(test.id)),
    );

    expect(count).toMatchInlineSnapshot(`123`);
  });

  it('with insert query should return rows', async () => {
    const rows = await db.with(
      `test`,
      () => db.select(star(db.foo)).from(db.foo),
      ({ test }) =>
        db
          .insertInto(db.foo, ['createDate', 'name', 'value'])
          .select(test.createDate, test.name, test.value)
          .from(test),
    );

    expect(rows).toMatchInlineSnapshot(`
      Array [
        Object {
          "a": "1",
        },
        Object {
          "b": "2",
        },
      ]
    `);
  });

  it('with select query should return rows', async () => {
    const rows = await db.with(
      `test`,
      () => db.select(star(db.foo)).from(db.foo),
      ({ test }) => db.select(test.id).from(test),
    );

    expect(rows).toMatchInlineSnapshot(`
      Array [
        Object {
          "a": "1",
        },
        Object {
          "b": "2",
        },
      ]
    `);
  });
});
