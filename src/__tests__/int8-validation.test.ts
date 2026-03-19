import { defineDb, defineTable, int8, integer, numeric, text, toSql } from '..';

describe('int8 validation', () => {
  const foo = defineTable({
    id: integer().primaryKey().notNull(),
    name: text().notNull(),
    bigValue: int8(),
    amount: numeric(),
  });

  const db = defineDb({ foo }, () => Promise.resolve({ rows: [], affectedCount: 0 }));

  describe('insert', () => {
    it('should allow safe integer values for int8 columns', () => {
      const query = db.insertInto(db.foo).values({
        id: 1,
        name: 'test',
        bigValue: '12345',
      });

      expect(toSql(query)).toMatchInlineSnapshot(`
        {
          "parameters": [
            1,
            "test",
            "12345",
          ],
          "text": "INSERT INTO foo (id, name, big_value) VALUES ($1, $2, $3)",
        }
      `);
    });

    it('should throw when inserting a number exceeding MAX_SAFE_INTEGER into an int8 column', () => {
      expect(() => {
        toSql(
          db.insertInto(db.foo).values({
            id: 1,
            name: 'test',
            bigValue: 10000000000000000 as any,
          }),
        );
      }).toThrow('int8 value is out-of-range for JS number in column "bigValue"');
    });

    it('should throw when inserting a number below MIN_SAFE_INTEGER into an int8 column', () => {
      expect(() => {
        toSql(
          db.insertInto(db.foo).values({
            id: 1,
            name: 'test',
            bigValue: -10000000000000000 as any,
          }),
        );
      }).toThrow('int8 value is out-of-range for JS number in column "bigValue"');
    });

    it('should allow MAX_SAFE_INTEGER exactly for int8 columns', () => {
      const query = db.insertInto(db.foo).values({
        id: 1,
        name: 'test',
        bigValue: Number.MAX_SAFE_INTEGER as any,
      });

      expect(toSql(query).parameters).toContain(Number.MAX_SAFE_INTEGER);
    });

    it('should not validate numeric columns', () => {
      const query = db.insertInto(db.foo).values({
        id: 1,
        name: 'test',
        amount: 10000000000000000 as any,
      });

      expect(toSql(query).parameters).toContain(10000000000000000);
    });

    it('should not validate non-number values for int8 columns', () => {
      const query = db.insertInto(db.foo).values({
        id: 1,
        name: 'test',
        bigValue: '10000000000000000',
      });

      expect(toSql(query).parameters).toContain('10000000000000000');
    });

    it('should allow null for int8 columns', () => {
      const query = db.insertInto(db.foo).values({
        id: 1,
        name: 'test',
        bigValue: null as any,
      });

      expect(toSql(query).parameters).toContain(null);
    });
  });

  describe('update', () => {
    it('should throw when updating an int8 column with a number exceeding MAX_SAFE_INTEGER', () => {
      expect(() => {
        toSql(
          db
            .update(db.foo)
            .set({ bigValue: 10000000000000000 as any })
            .where(db.foo.id.eq(1)),
        );
      }).toThrow('int8 value is out-of-range for JS number in column "bigValue"');
    });

    it('should allow safe values in update', () => {
      const query = db.update(db.foo).set({ bigValue: '12345' }).where(db.foo.id.eq(1));

      expect(toSql(query).parameters[0]).toBe('12345');
    });

    it('should not validate numeric columns in update', () => {
      const query = db
        .update(db.foo)
        .set({ amount: 10000000000000000 as any })
        .where(db.foo.id.eq(1));

      expect(toSql(query).parameters[0]).toBe(10000000000000000);
    });
  });

  describe('values', () => {
    it('should throw when a values list contains an int8 number exceeding MAX_SAFE_INTEGER', () => {
      expect(() => {
        const valuesList = db.values('vals', { bigValue: int8() }, [
          { bigValue: 10000000000000000 as any },
        ]);

        toSql(db.select(db.star()).from(valuesList));
      }).toThrow('int8 value is out-of-range for JS number in column "bigValue"');
    });

    it('should allow safe values in values list', () => {
      const valuesList = db.values('vals', { bigValue: int8() }, [{ bigValue: '12345' }]);

      const query = db.select(db.star()).from(valuesList);
      expect(toSql(query).parameters).toContain('12345');
    });
  });
});
