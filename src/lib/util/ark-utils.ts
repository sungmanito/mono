// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Problems, Type } from 'arktype';

/**
 * 
 * @throws {Problems}
 * @param value an unknown value
 * @param validator an arktype validator
 * @returns 
 */
export function validate<
  T,
  V extends Type<unknown>,
  R = V extends Type<infer R> ? R : never,
>(value: T, validator: V): R {
  const { data, problems } = validator(value);

  if (problems) throw problems;

  return data as R;
}
