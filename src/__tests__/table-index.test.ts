import { defineDb, defineTable, enumType, integer, text, timestampWithTimeZone, toSql, uuid } from '..';
import { inlineValue } from '../expression';
import { btree, gin, gist } from '../table-index-types';

const foo = defineTable({
  columns: {
    id: uuid().primaryKey().default(`gen_random_uuid()`),
    createDate: timestampWithTimeZone().notNull().default(`now()`),
    name: text().notNull(),
    value: integer(),
    status: enumType<'open' | 'closed'>('open_status', ['open', 'closed']),
  },
  defineIndexes: (foo) => ({
    fooPkey: btree(foo.id).primaryKey(),
    fooCompound: btree(foo.id, foo.name).unique(),
    fooGist: gist(foo.id, foo.createDate),
    fooGin: gin(foo.name, foo.value),
    fooCovering: btree(foo.id).unique().include(foo.name, foo.value, foo.createDate),
    fooNonNull: btree(foo.id).where(foo.value.isNotNull()),
    fooExpression: gin(foo.id, foo.name, foo.value.gt(25)).where(foo.name.eq('foo')),
    fooWhereEnum: btree(foo.id).where(foo.status.eq(inlineValue('open', 'open_status'))),
  }),
});

const db = defineDb({ foo }, () => Promise.resolve({ rows: [], affectedCount: 0 }));
const indexes = db.foo.getIndexes();

describe('defineIndexes', () => {
  test('should generate correct tokens for a simple case', () => {
    expect(toSql(indexes.fooPkey).text).toEqual('CREATE UNIQUE INDEX foo_pkey ON public.foo USING btree (id)');
  });
  test('should generate correct tokens for a compound index', () => {
    expect(toSql(indexes.fooCompound).text).toEqual('CREATE UNIQUE INDEX foo_compound ON public.foo USING btree (id, name)');
  });
  test('should generate correct tokens for a gist index', () => {
    expect(toSql(indexes.fooGist).text).toEqual('CREATE INDEX foo_gist ON public.foo USING gist (id, create_date)');
  });
  test('should generate correct tokens for a gin index', () => {
    expect(toSql(indexes.fooGin).text).toEqual('CREATE INDEX foo_gin ON public.foo USING gin (name, value)');
  });
  test('should generate correct tokens for an index with an include clause', () => {
    expect(toSql(indexes.fooCovering).text).toEqual('CREATE UNIQUE INDEX foo_covering ON public.foo USING btree (id) INCLUDE (name, value, create_date)');
  });
  test('should generate correct tokens for an index with a where clause', () => {
    expect(toSql(indexes.fooNonNull).text).toEqual('CREATE INDEX foo_non_null ON public.foo USING btree (id) WHERE (value IS NOT NULL)');
  });
  test('should generate correct tokens for an index with an expression as part of the compound index', () => {
    expect(toSql(indexes.fooExpression).text).toEqual('CREATE INDEX foo_expression ON public.foo USING gin (id, name, (value > 25)) WHERE (name = \'foo\')');
  });
  test('should generate correct tokens for an index with an enum in the where clause', () => {
    expect(toSql(indexes.fooWhereEnum).text).toEqual('CREATE INDEX foo_where_enum ON public.foo USING btree (id) WHERE (status = \'open\'::open_status)');
  });
});
