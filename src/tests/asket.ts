import { assert } from 'chai';

import {
  Asket,
} from '../lib/asket';

export default function () {
  describe('Asket:', () => {
    it(`fields not exists`, () => {
      const names = [];
      return new Asket(
        { schema: {} },
        (schema, data, env, steps, name) => {
          names.push(name);
          return new Promise(r => r({ data: 123 }));
        },
      ).exec().then(({ data }) => {
        assert.deepEqual(names, [undefined]);
        assert.deepEqual(data, 123);
      });
    });
    it(`fields empty`, () => {
      const names = [];
      return new Asket(
        { schema: { fields: {} } },
        (schema, data, env, steps, name) => {
          names.push(name);
          return new Promise(r => r({ data: 123 }));
        },
      ).exec().then(({ data }) => {
        assert.deepEqual(names, [undefined]);
        assert.deepEqual(data, {});
      });
    });
    it(`fields simple`, () => {
      const names = [];
      return new Asket(
        { schema: { fields: { a: {} } } },
        (schema, data, env, steps, name) => new Promise((r) => {
          names.push(name);
          r({ data: 123 });
        }),
      ).exec().then(({ data }) => {
        assert.deepEqual(names, [undefined, 'a']);
        assert.deepEqual(data, { a: 123 });
      });
    });
    it(`arrays`, () => {
      const names = [];
      return new Asket(
        { schema: { fields: { a: { fields: { b: { fields: { c: {} } } } } } } },
        (schema, data, env, steps, name) => new Promise((r) => {
          names.push(name);
          if (steps.length === 1) {
            r({ data: [123, 123] });
          } else {
            r({ data: 123 });
          }
        }),
      ).exec().then(({ data }) => {
        assert.deepEqual(names, [undefined, 'a', 'b', 'b', 'c', 'c']);
        assert.deepEqual(data, { a: [{ b: { c: 123 } }, { b: { c: 123 } }] });
      });
    });
    it(`not in fields`, () => {
      const names = [];
      return new Asket(
        { schema: { fields: { a: {} } } },
        (schema, data, env, steps, name) => new Promise((r) => {
          names.push(name);
          if (!steps.length) {
            r({ data: { a: 234, b: 345 } });
          } else {
            r({ data: 123 });
          }
        }),
      ).exec().then(({ data }) => {
        assert.deepEqual(names, [undefined, 'a']);
        assert.deepEqual(data, { a: 123 });
      });
    });
    it(`fill`, () => {
      const names = [];
      return new Asket(
        { schema: { fields: { a: {} }, fill: true } },
        (schema, data, env, steps, name) => new Promise((r) => {
          names.push(name);
          if (!steps.length) {
            r({ data: { a: 234, b: 345 } });
          } else {
            r({ data: 123 });
          }
        }),
      ).exec().then(({ data }) => {
        assert.deepEqual(names, [undefined, 'a']);
        assert.deepEqual(data, { a: 123, b: 345 });
      });
    });
    it(`options`, () => {
      const names = [];
      return new Asket(
        { schema: { options: { key: 'abc' }, fill: true } },
        (schema, data, env, steps, name) => new Promise((r) => {
          names.push(name);
          r({ data: { [schema.options.key]: 123 } });
        }),
      ).exec().then(({ data }) => {
        assert.deepEqual(names, [undefined]);
        assert.deepEqual(data, { abc: 123 });
      });
    });
    it(`variables`, () => {
      const names = [];
      return new Asket(
        { variables: { x: 345 }, schema: { fields: { a: { options: { y: 'x' } } } } },
        function (schema, data, env, steps, name) {
          return new Promise((r) => {
            names.push(name);
            if (!steps.length) {
              r({ data: {} });
            } else {
              r({ data: this.query.variables[schema.options.y] });
            }
          });
        },
      ).exec().then(({ data }) => {
        assert.deepEqual(names, [undefined, 'a']);
        assert.deepEqual(data, { a: 345 });
      });
    });
    it(`fragment`, () => {
      const names = [];
      return new Asket(
        { fragments: { x: { fields: { y: {} } } }, schema: { fields: { a: { fragment: 'x' } } } },
        (schema, data, env, steps, name) => new Promise((r) => {
          names.push(name);
          r({ data: 123 });
        }),
      ).exec().then(({ data }) => {
        assert.deepEqual(names, [undefined, 'a', 'y']);
        assert.deepEqual(data, { a: { y: 123 } });
      });
    });
    it(`recursion`, () => {
      const names = [];
      return new Asket(
        {
          fragments: { x: { fields: { y: { fragment: 'x' } } } },
          schema: { fields: { a: { fragment: 'x' } } },
        },
        (schema, data, env, steps, name) => new Promise((r) => {
          names.push(name);
          r({ data: 123, dontExec: steps.length > 5 });
        }),
      ).exec().then(({ data }) => {
        assert.deepEqual(names, [undefined, 'a', 'y', 'y', 'y', 'y', 'y']);
        assert.deepEqual(data, { a: { y: { y: { y: { y: { y: 123 } } } } } });
      });
    });
    it(`requiredSchema`, () => {
      const names = [];
      return new Asket(
        { schema: { fields: { a: {} } } },
        (schema, data, env, steps, name) => new Promise((r) => {
          names.push(name);
          if (env === 'root') {
            r({
              data: { a: 123, b: 234, c: 345 },
              requiredSchema: { fields: { c: {} } },
            });
          } else {
            r({ data });
          }
        }),
        'root',
      ).exec().then(({ data }) => {
        assert.deepEqual(names, [undefined, 'a', 'c']);
        assert.deepEqual(data, { a: 123, c: 345 });
      });
    });
    it(`aliases`, () => {
      const names = [];
      return new Asket(
        { schema: { fields: { b: { name: 'y' } } } },
        (schema, data, env, steps, name) => new Promise((r) => {
          names.push(name);
          if (env === 'root') r({ data: { y: 123 } });
          else r({ data });
        }),
        'root',
      ).exec().then(({ data }) => {
        assert.deepEqual(names, [undefined, 'y']);
        assert.deepEqual(data, { b: 123 });
      });
    });
  });
}
