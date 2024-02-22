import { describe, it, expect } from 'vitest';
import { createInsertSchema, mapToArkType } from './index';
import {
  pgTable,
  text,
  uuid,
  integer,
  date,
  timestamp,
  smallint,
  bigint,
  smallserial,
  bigserial,
  varchar,
} from 'drizzle-orm/pg-core';

describe('mapToArkType', () => {
  const intTable = pgTable('integers', {
    base: integer('base'),
    smallInt: smallint('small_int'),
    bigInt: bigint('big_int', { mode: 'number' }),
    reallyBigInt: bigint('really_big_int', { mode: 'bigint' }),
    smallSerial: smallserial('small_serial'),
    bigSerial: bigserial('big_serial', { mode: 'number' }),
    reallyBigSerial: bigserial('really_big_serial', { mode: 'bigint' }),
  });

  const textTable = pgTable('texts', {
    text: text('text'),
    textWithEnum: text('text_with_enums', { enum: ['a', 'b'] }),
    varchar: varchar('varchar_column'),
    varcharWithLimit: varchar('varchar_with_limit', { length: 10 })
  });

  it('Works with integer columns', () => {
    expect(mapToArkType(intTable.base)).toBe('number');
    expect(mapToArkType(intTable.smallInt)).toBe('number');
    expect(mapToArkType(intTable.bigInt)).toBe('number');
    expect(mapToArkType(intTable.reallyBigInt)).toBe('bigint');
    expect(mapToArkType(intTable.smallSerial)).toBe('number');
    expect(mapToArkType(intTable.bigSerial)).toBe('number');
    expect(mapToArkType(intTable.reallyBigSerial)).toBe('bigint');
  });

  it('Works with string/text columns', () => {
    expect(mapToArkType(textTable.text)).toBe('string');
    expect(mapToArkType(textTable.textWithEnum)).toBe("'a' | 'b'");
    expect(mapToArkType(textTable.varchar)).toBe('string');
    expect(mapToArkType(textTable.varcharWithLimit)).toBe('string<=10')
  });
});

describe('createInsertSchema', () => {
  const exampleWithArrayColumn = pgTable('example', {
    id: uuid('id').primaryKey(),
    things: integer('things').array(),
    something: integer('something').notNull(),
    date: date('date', { mode: 'string' }),
  });

  const exampleSimple = pgTable('users', {
    id: uuid('id').primaryKey(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    varchar: varchar('varchar', { length: 100 })
  });

  describe('createInsertSchema', () => {
    it('Works with simple types', () => {
      const insertSchema = createInsertSchema(exampleSimple);
      const uid = crypto.randomUUID();
      const d = new Date();
      const output = insertSchema({
        id: uid,
        name: 'Testing',
        createdAt: d,
        varchar: 'a'
      });
      // No problems
      expect(output.problems).toBeUndefined();

      // data is valid
      expect(output.data).toStrictEqual({
        id: uid,
        name: 'Testing',
        createdAt: d,
        varchar: 'a'
      });

    });
  });
});
