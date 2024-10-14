import { defineDb, defineTable, integer, text, timestampWithTimeZone, uuid } from '..';
import { expect, describe, test } from 'tstyche';
import { btree, gin, gist } from '../table-index-types';
import { Index } from '../table-index';

const foo = defineTable({
  columns: {
    id: uuid().primaryKey().default(`gen_random_uuid()`),
    createDate: timestampWithTimeZone().notNull().default(`now()`),
    name: text().notNull(),
    value: integer(),
  },
  defineIndexes: (foo) => ({
    fooPkey: btree(foo.id).primaryKey(),
    fooCompound: btree(foo.id, foo.name).unique(),
    fooGist: gist(foo.id, foo.createDate),
    fooGin: gin(foo.name, foo.value),
    fooCovering: btree(foo.id).unique().include(foo.name, foo.value, foo.createDate),
    fooNonNull: btree(foo.id).where(foo.value.isNotNull()),
    fooExpression: gin(foo.id, foo.name, foo.value.gt(25)).where(foo.name.eq('foo')),
  }),
});

const db = defineDb({ foo }, () => Promise.resolve({ rows: [], affectedCount: 0 }));
const indexes = db.foo.getIndexes();

describe('defineIndexes', () => {
  test('should preserve index names as type keys', () => {
    expect(Object.keys(indexes)).type.toBe([
      'fooPkey',
      'fooCompound',
      'fooGist',
      'fooGin',
      'fooCovering',
      'fooNonNull',
      'fooExpression'
    ]);
  });

  test('should set PrimaryKey and UniqueKey true when primaryKey is called', () => {
    expect(indexes.fooPkey).type.toBe<Index<'fooPkey', 'foo', true, true>>();
  });

  test('should set only UniqueKey type true when uniqueKey is called', () => {
    expect(indexes.fooCompound).type.toBe<Index<'fooCompound', 'foo', false, true>>();
  });
});
