import { defineDb, defineTable, integer, text, timestampWithTimeZone, toSql, uuid } from '..';
import { Query } from '../query';

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

  let lastExecuteFnArgs: { text: string; parameters: Array<string> } | null = null;

  const db = defineDb({ foo, bar }, (query, parameters) => {
    lastExecuteFnArgs = { text: query, parameters };
    return Promise.resolve({ rows: [], affectedCount: 0 });
  });

  const checkQueryAsync = async (
    query: Query<any>,
    expected: {
      text: string;
      parameters: any[];
    },
  ) => {
    expect(toSql(query)).toStrictEqual(expected);
    await query;
    expect(lastExecuteFnArgs).toStrictEqual(expected);
  };

  it(`select`, async () => {
    const query = db
      .comment('This is a comment')
      .select(db.bar.id)
      .from(db.bar)
      .where(db.bar.name.eq('Test'));

    await checkQueryAsync(query, {
      parameters: ['Test'],
      text: '/*This is a comment*/ SELECT bar.id FROM bar WHERE bar.name = $1',
    });
  });

  it(`update`, async () => {
    const query = db.comment('This is a comment').update(db.bar).set({ name: `Test` });

    await checkQueryAsync(query, {
      parameters: ['Test'],
      text: '/*This is a comment*/ UPDATE bar SET name = $1',
    });
  });

  it(`insert`, async () => {
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

    await checkQueryAsync(query, {
      parameters: ['Test', 'Test 2'],
      text: '/*This is a comment*/ INSERT INTO foo (name) VALUES ($1), ($2)',
    });
  });

  it(`update`, async () => {
    const query = db
      .comment('This is a comment')
      .update(db.foo)
      .set({ name: `Test` })
      .from(db.bar)
      .where(db.bar.fooId.eq(db.foo.id).and(db.bar.name.isNotNull()));

    await checkQueryAsync(query, {
      parameters: ['Test'],
      text: '/*This is a comment*/ UPDATE foo SET name = $1 FROM bar WHERE bar.foo_id = foo.id AND bar.name IS NOT NULL',
    });
  });

  it(`with`, async () => {
    const query = db.with(
      'a',
      db.comment('A').select(db.bar.id).from(db.bar).where(db.bar.name.eq('TestA')),
      'b',
      db.comment('B').select(db.foo.name).from(db.foo).where(db.foo.id.eq('TestB')),
      ({ a, b }) => db.comment('C').select(a.id, b.name).from(a).join(b),
    );

    await checkQueryAsync(query, {
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
