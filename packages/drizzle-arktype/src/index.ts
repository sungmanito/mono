import { arrayOf, type, union, type Infer, type PrecompiledDefaults, type Type } from 'arktype';
import type {
  Assume,
  Column,
  DrizzleTypeError,
  Equal,
  Simplify,
  Table
} from 'drizzle-orm';
import { getTableColumns, is } from 'drizzle-orm';
import { PgArray, PgBigInt53, PgBigInt64, PgDate, PgTime, PgTimestamp, PgUUID, PgVarchar, pgTable, text, uuid } from 'drizzle-orm/pg-core';

const literalSchema = type(union(union(union('string', 'number'), 'boolean'), 'null'));

type Literal = Infer<typeof literalSchema>;

type Json = Literal | {[key: string]: Json};

type MapInsertColumnsToArk<TColumn extends Column, TType extends Type<any>> = TColumn['_']['notNull'] extends false
  ? Type<Partial<TType>>
  : TColumn['_']['hasDefault'] extends true ? Type<Partial<TType>> : TType;

type MapSelectColumnToArk<TColumn extends Column, TType extends Type<any>> = TColumn['_']['notNull'] extends false 
  ? Type<Partial<TType>>
  : TType;

type MapColumnToArk<TColumn extends Column, TType extends Type<any>, TMode extends 'insert' | 'select'> = 
  TMode extends 'insert' ? MapInsertColumnsToArk<TColumn, TType> : MapSelectColumnToArk<TColumn, TType>;

type MaybeOptional<
  TColumn extends Column,
  TType extends Type<any>,
  TMode extends 'insert' | 'select',
  TNoOptional extends boolean
> = TNoOptional extends true ? TType
  : MapColumnToArk<TColumn, TType, TMode>;

let a = arrayOf('number | string')

type GetArkType<TColumn extends Column> = TColumn['_']['dataType'] extends infer TDataType
  ? TDataType extends 'custom' ? PrecompiledDefaults['any']
  : TDataType extends 'json'
    ? Type<Json>
    : TColumn extends { enumValues: [string, ...string[]] }
      ? Equal<TColumn['enumValues'], [string, ...string[]]> extends true
        ? PrecompiledDefaults['string']
        : Type<TColumn['enumValues']>
      : TDataType extends 'array' 
        ? GetArkType<Assume<TColumn['_'], { baseColumn: Column }>['baseColumn']>[]
        : TDataType extends 'bigint' ?
          PrecompiledDefaults['bigint']
          : TDataType extends 'number'
            ? PrecompiledDefaults['number']
            : TDataType extends 'string'
              ? PrecompiledDefaults['string']
              : TDataType extends 'boolean'
                ? PrecompiledDefaults['boolean']
                : TDataType extends 'date'
                  ? PrecompiledDefaults['Date']
                  : PrecompiledDefaults['any']
                  : never;

type ValueOrUpdater<T, TUpdaterArg> = T | ((arg: TUpdaterArg) => T);

type UnwrapValueOrUpdater<T> = T extends ValueOrUpdater<infer U, any> ? U : never;

type Refine<TTable extends Table, TMode extends 'select' | 'insert'> = {
  [K in keyof TTable['_']['columns']]?: ValueOrUpdater<
    PrecompiledDefaults['any'],
    TMode extends 'select' ? BuildSelectSchema<TTable, {}, true> : BuildInsertSchema<TTable, {}, true>
  >
};

type BuildSelectSchema<
  TTable extends Table,
  TRefine extends Refine<TTable, 'select'>,
  TNoOptional extends boolean = false
> = Simplify<
  {
    [K in keyof TTable['_']['columns']]: MaybeOptional<
      TTable['_']['columns'][K],
      (K extends keyof TRefine ? Assume<UnwrapValueOrUpdater<TRefine[K]>, PrecompiledDefaults['any']>
        : GetArkType<TTable['_']['columns'][K]>),
      'select',
      TNoOptional
    >
  }
>;

export type BuildInsertSchema<
  TTable extends Table,
  TRefine extends Refine<TTable, 'insert'> | {},
  TNoOptional extends boolean = false,
> = TTable['_']['columns'] extends infer TColumns extends Record<string, Column<any>> ? {
  [K in keyof TColumns & string]: MaybeOptional<
    TColumns[K],
    (K extends keyof TRefine ? Assume<UnwrapValueOrUpdater<TRefine[K]>, PrecompiledDefaults['any']>
      : GetArkType<TColumns[K]>),
    'insert',
    TNoOptional
  >;
}
  : never;


const exampleTable = pgTable('something', {
  id: uuid('id').primaryKey(),
  name: text('name').array(),
});


export function createInsertSchema<
	TTable extends Table,
	TRefine extends Refine<TTable, 'insert'> = Refine<TTable, 'insert'>,
>(
	table: TTable,
	/**
	 * @param refine Refine schema fields
	 */
	refine?: {
		[K in keyof TRefine]: K extends keyof TTable['_']['columns'] ? TRefine[K]
			: DrizzleTypeError<`Column '${K & string}' does not exist in table '${TTable['_']['name']}'`>;
	},
): Type<BuildInsertSchema<TTable, Equal<TRefine, Refine<TTable, 'insert'>> extends true ? {} : TRefine>> {

  const columns = getTableColumns(table);
  const columnEntries = Object.entries(columns);

  const map = Object.fromEntries(
    columnEntries.map(([key, value]) => columnToArkType(key,value)),
  );
  
  return type(map);
}

function columnToArkType(key: string, column: Column) {
  // console.info(column);
  let mappedKey = key;

  if(!column.notNull || column.hasDefault) mappedKey = `${mappedKey}?`;

  return [mappedKey, mapToArkType(column)];
}

export function createUpdateSchema() {

}

export function mapToArkType(column: Column): keyof PrecompiledDefaults | string {

  if(is(column, PgUUID)) return 'uuid';

  if(is(column, PgDate) || is(column, PgTimestamp)) return 'Date';

  if(column.dataType === 'array') return mapToArkType((column as PgArray<any, any>).baseColumn);

  if(column.dataType === 'string' && column.enumValues) return `${column.enumValues.map(v => `'${v}'`).join(' | ')}`

  if(is(column, PgVarchar) && column.length) return `${column.dataType}<=${column.length}`;

  return column.dataType as keyof PrecompiledDefaults;
}
