import { defineDb, defineTable, integer, text, timestampWithTimeZone, toSql, uuid } from '..';

describe(`comment`, () => {
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

  it(`select`, () => {
    const query = db
      .comment('This is a comment')
      .select(db.bar.id)
      .from(db.bar)
      .where(db.bar.name.eq('Test'));

    expect(toSql(query)).toStrictEqual({
      parameters: ['Test'],
      text: '/*This is a comment*/ SELECT bar.id FROM bar WHERE bar.name = $1',
    });
  });

  it(`update`, () => {
    const query = db.comment('This is a comment').update(db.bar).set({ name: `Test` });

    expect(toSql(query)).toStrictEqual({
      parameters: ['Test'],
      text: '/*This is a comment*/ UPDATE bar SET name = $1',
    });
  });

  it(`insert`, () => {
    const query = db
      .comment('This is a comment')
      .insertInto(db.foo)
      .values([
        {
          name: `Test`,
        },
        {
          name: `Test 2`,
        },
      ]);

    expect(toSql(query)).toEqual({
      parameters: ['Test', 'Test 2'],
      text: '/*This is a comment*/ INSERT INTO foo (name) VALUES ($1), ($2)',
    });
  });

  it(`update`, () => {
    const query = db
      .comment('This is a comment')
      .update(db.foo)
      .set({ name: `Test` })
      .from(db.bar)
      .where(db.bar.fooId.eq(db.foo.id).and(db.bar.name.isNotNull()));

    expect(toSql(query)).toStrictEqual({
      parameters: ['Test'],
      text: '/*This is a comment*/ UPDATE foo SET name = $1 FROM bar WHERE bar.foo_id = foo.id AND bar.name IS NOT NULL',
    });
  });

  it(`with`, () => {
    const query = db.with(
      'a',
      db.comment('A').select(db.bar.id).from(db.bar).where(db.bar.name.eq('TestA')),
      'b',
      db.comment('B').select(db.foo.name).from(db.foo).where(db.foo.id.eq('TestB')),
      ({ a, b }) => db.comment('C').select(a.id, b.name).from(a).join(b),
    );

    expect(toSql(query)).toStrictEqual({
      parameters: ['TestA', 'TestB'],
      text: [
        '/*C*/ WITH',
        'a AS (/*A*/ SELECT bar.id FROM bar WHERE bar.name = $1),',
        'b AS (/*B*/ SELECT foo.name FROM foo WHERE foo.id = $2)',
        'SELECT a.id, b.name FROM a JOIN b',
      ].join(' '),
    });
  });
});
