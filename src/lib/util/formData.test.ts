import {
  expect, describe, it
} from 'vitest';
import { formDataToObject, formDataValidObject } from './formData';
import { type } from 'arktype';


describe('formDataToObject', () => {

  it('Should parse empty formData object', () => {
    const obj = formDataToObject(new FormData());
    expect(Object.keys(obj).length).toBe(0)
  });

  it('Should work on basic string data', () => {
    const fd = new FormData();
    fd.append('name', 'bob');
    fd.append('surname', 'surbob');
    const obj = formDataToObject(fd);
    expect(obj).toStrictEqual({ name: 'bob', surname: 'surbob'});
  });

  it('Should work for mixed types', () => {
    const fd = new FormData();
    fd.append('name', 'bob');
    fd.append('surname', 'surbob');
    fd.append('age', '52');
    const obj = formDataToObject(fd);
    expect(obj).toStrictEqual({name: 'bob', surname: 'surbob', age: 52});

    fd.append('universe', 'true');
    const obj2 = formDataToObject(fd);
    expect(obj2).toHaveProperty('universe');
    expect(obj2.universe).toBeTruthy();

    fd.append('parents', 'false');

    const obj3 = formDataToObject(fd);
    expect(obj3).toHaveProperty('parents');
    expect(obj3.parents).toBeFalsy();

    fd.append('explicitNotation', '103n');

    const obj4 = formDataToObject(fd);
    expect(obj4.explicitNotation).toStrictEqual(103n);

    fd.append('implicitBig', '9007199254740992');
    const obj5 = formDataToObject(fd);
    expect(obj5.implicitBig).toStrictEqual(9007199254740992n);

    expect(obj5).toStrictEqual({
      name: 'bob',
      surname: 'surbob',
      age: 52,
      universe: true,
      parents: false,
      explicitNotation: 103n,
      implicitBig: 9007199254740992n,
    });
    
  });

  it('Should work with the filter function', () => {
    const fd = new FormData();
    fd.append('name', 'bob');
    fd.append('notAllowed', 'secret informations');
    fd.append('surname', 'surbob');

    const obj = formDataToObject(fd, ([key]) => key !== 'notAllowed');
    expect(obj).toStrictEqual({name: 'bob', surname: 'surbob'});
  })
});

describe('formDataValidObject', () => {
  it('Validates simple object', () => {
    const schema = type({
      name: 'string',
      surname: 'string'
    });
    const fd = new FormData();
    fd.append('name', 'bob');
    fd.append('surname', 'surbob');

    const obj = formDataValidObject(fd, schema);

    expect(obj).toStrictEqual({name: 'bob', surname: 'surbob'});

    const wontPassSchema = type({
      name: 'number',
      surname: 'Set'
    });

    expect(() => formDataValidObject(fd, wontPassSchema)).toThrow();

  });
});
