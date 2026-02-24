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

  const failingDb = defineDb({ foo }, () => Promise.reject(new Error(`connection refused`)));

  describe(`async stack traces`, () => {
    // V8's async stack trace support only works with native Promises, not custom
    // thenables. Since query objects implement .then() directly, awaiting them
    // loses the caller's stack frame. The .execute() method returns a native
    // Promise, preserving the full async call chain in stack traces.

    async function selectViaNativePromise() {
      return await failingDb.select(failingDb.foo.id).from(failingDb.foo).execute();
    }

    it(`execute() should preserve caller in async stack trace`, async () => {
      try {
        await selectViaNativePromise();
        fail(`should have thrown`);
      } catch (e: any) {
        expect(e.message).toBe(`connection refused`);
        expect(e.stack).toContain(`selectViaNativePromise`);
      }
    });
  });

  it(`select should return rows`, async () => {
    const rows = await db.select(db.foo.id).from(db.foo);

    expect(rows).toMatchInlineSnapshot(`
      [
        {
          "a": "1",
        },
        {
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
      [
        {
          "a": "1",
        },
        {
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
      [
        {
          "a": "1",
        },
        {
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
      [
        {
          "a": "1",
        },
        {
          "b": "2",
        },
      ]
    `);
  });

  it('with update should return count', async () => {
    const count = await db.with(
      `test`,
      () => db.select(star(db.foo)).from(db.foo),
      ({ test }) => db.update(db.foo).set({ name: 'foo' }).from(test).where(db.foo.id.eq(test.id)),
    );

    expect(count).toMatchInlineSnapshot(`123`);
  });

  it('with delete should return count', async () => {
    const count = await db.with(
      `test`,
      () => db.select(star(db.foo)).from(db.foo),
      ({ test }) => db.deleteFrom(db.foo).using(test).where(db.foo.id.eq(test.id)),
    );

    expect(count).toMatchInlineSnapshot(`123`);
  });

  it('with insert should return count', async () => {
    const count = await db.with(
      `test`,
      () => db.select(star(db.foo)).from(db.foo),
      ({ test }) => db.insertInto(db.foo).defaultValues(),
    );

    expect(count).toMatchInlineSnapshot(`123`);
  });

  it('with insert with returning should return rows', async () => {
    const rows = await db.with(
      `test`,
      () => db.select(star(db.foo)).from(db.foo),
      ({ test }) => db.insertInto(db.foo).defaultValues().returning('id'),
    );

    expect(rows).toMatchInlineSnapshot(`
      [
        {
          "a": "1",
        },
        {
          "b": "2",
        },
      ]
    `);
  });

  it('with select should return rows', async () => {
    const rows = await db.with(
      `test`,
      () => db.select(star(db.foo)).from(db.foo),
      ({ test }) => db.select(test.id).from(test),
    );

    expect(rows).toMatchInlineSnapshot(`
      [
        {
          "a": "1",
        },
        {
          "b": "2",
        },
      ]
    `);
  });
});
