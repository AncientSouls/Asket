import { assert } from 'chai';
import * as _ from 'lodash';

import {
  asket,
} from '../lib/asket';

export default function () {
  describe('asket()', () => {
    it(`fields`, () => {
      const keys = [];
      const names = [];

      return asket({
        query: { schema: { fields: {
          a: {}, b: {}, c: {},
        } } },
        resolver: flow => new Promise((resolve) => {
          keys.push(flow.key);
          names.push(flow.name);

          resolve({
            ...flow,
            data: (flow.name === 'a' ? {}
          : (flow.name === 'b' ? { x: 'y' }
          : (flow.name === 'c' ? 123 : {}))),
          });
        }),
      }).then((flow) => {
        assert.deepEqual(keys, [undefined, 'a', 'b', 'c']);
        assert.deepEqual(names, [undefined, 'a', 'b', 'c']);

        assert.deepEqual(flow.data, { a: {}, b: {}, c: 123 });
      });
    });
    it(`arrays`, () => {
      const keys = [];
      const names = [];

      return asket({
        query: { schema: { fields:
          { a: { fields: { b: { fields: { c: {} } } } } },
        } },
        resolver: flow => new Promise((resolve) => {
          keys.push(flow.key);
          names.push(flow.name);

          resolve({
            ...flow,
            data: flow.name === 'a' ? [123, 234] : 345,
          });
        }),
      }).then((flow) => {
        assert.deepEqual(keys, [undefined, 'a', 0, 1, 'b', 'b', 'c', 'c']);
        assert.deepEqual(names, [undefined, 'a', undefined, undefined, 'b', 'b', 'c', 'c']);

        assert.deepEqual(flow.data, { a: [{ b: { c: 345 } }, { b: { c: 345 } }] });
      });
    });
    it(`not in fields`, () => {
      const keys = [];
      const names = [];

      return asket({
        query: { schema: { fields: { a: {} } } },
        resolver: flow => new Promise((resolve) => {
          keys.push(flow.key);
          names.push(flow.name);

          resolve({
            ...flow,
            data: flow.path.length === 1 ? { a: 234, b: 345 } : flow.data,
          });
        }),
      }).then((flow) => {
        assert.deepEqual(keys, [undefined, 'a']);
        assert.deepEqual(names, [undefined, 'a']);

        assert.deepEqual(flow.data, { a: 234 });
      });
    });
    it(`fill`, () => {
      const keys = [];
      const names = [];

      return asket({
        query: { schema: { fields: { a: {} }, fill: true  } },
        resolver: flow => new Promise((resolve) => {
          keys.push(flow.key);
          names.push(flow.name);

          resolve({
            ...flow,
            data: flow.path.length === 1 ? { a: 234, b: 345 } : flow.data,
          });
        }),
      }).then((flow) => {
        assert.deepEqual(keys, [undefined, 'a']);
        assert.deepEqual(names, [undefined, 'a']);

        assert.deepEqual(flow.data, { a: 234, b: 345 });
      });
    });
    it(`options`, () => {
      const keys = [];
      const names = [];

      return asket({
        query: { schema: { options: { key: 'a' }, fill: true } },
        resolver: flow => new Promise((resolve) => {
          keys.push(flow.key);
          names.push(flow.name);

          resolve({
            ...flow,
            data: { [flow.schema.options.key]: 123 },
          });
        }),
      }).then((flow) => {
        assert.deepEqual(keys, [undefined]);
        assert.deepEqual(names, [undefined]);

        assert.deepEqual(flow.data, { a: 123 });
      });
    });
    it(`variables`, () => {
      const keys = [];
      const names = [];

      return asket({
        query: {
          variables: { x: 345 },
          schema: { fields: { a: { options: { y: 'x' } } } },
        },
        resolver: flow => new Promise((resolve) => {
          keys.push(flow.key);
          names.push(flow.name);

          resolve({
            ...flow,
            data: flow.path.length === 1 ? {} : flow.query.variables[flow.schema.options.y],
          });
        }),
      }).then((flow) => {
        assert.deepEqual(keys, [undefined, 'a']);
        assert.deepEqual(names, [undefined, 'a']);

        assert.deepEqual(flow.data, { a: 345 });
      });
    });
    it(`fragment`, () => {
      const keys = [];
      const names = [];

      return asket({
        query: {
          fragments: { x: { fields: { y: {} } } },
          schema: { fields: { a: { use: 'x' } } },
        },
        resolver: flow => new Promise((resolve) => {
          keys.push(flow.key);
          names.push(flow.name);

          resolve({
            ...flow,
            data: 123,
          });
        }),
      }).then((flow) => {
        assert.deepEqual(keys, [undefined, 'a', 'y']);
        assert.deepEqual(names, [undefined, 'a', 'y']);

        assert.deepEqual(flow.data, { a: { y: 123 } });
      });
    });
    it(`recursion`, () => {
      const keys = [];
      const names = [];

      return asket({
        query: {
          fragments: { x: { fields: { y: { use: 'x' } } } },
          schema: { fields: { a: { use: 'x' } } },
        },
        resolver: flow => new Promise((resolve) => {
          keys.push(flow.key);
          names.push(flow.name);

          resolve({
            ...flow,
            data: 123,
            stop: flow.path.length > 6,
          });
        }),
      }).then((flow) => {
        assert.deepEqual(keys, [undefined, 'a', 'y', 'y', 'y', 'y', 'y']);
        assert.deepEqual(names, [undefined, 'a', 'y', 'y', 'y', 'y', 'y']);

        assert.deepEqual(flow.data, { a: { y: { y: { y: { y: { y: 123 } } } } } });
      });
    });
    it(`ovveride schema`, () => {
      const keys = [];
      const names = [];

      return asket({
        query: {
          schema: { fields: { a: {} } },
        },
        resolver: flow => new Promise((resolve) => {
          keys.push(flow.key);
          names.push(flow.name);

          const schema = flow.path.length === 1
          ? _.merge({}, flow.schema, { fields: { c: {} } })
          : flow.schema;

          resolve({
            ...flow,
            schema,
            data: flow.path.length === 1 ? { a: 123, b: 234, c: 345 } : flow.data,
          });
        }),
      }).then((flow) => {
        assert.deepEqual(keys, [undefined, 'a', 'c']);
        assert.deepEqual(names, [undefined, 'a', 'c']);

        assert.deepEqual(flow.data, { a: 123, c: 345 });
      });
    });
    it(`aliases`, () => {
      const keys = [];
      const names = [];

      return asket({
        query: {
          schema: { fields: { a: { name: 'b' } } },
        },
        resolver: flow => new Promise((resolve) => {
          keys.push(flow.key);
          names.push(flow.name);

          resolve({
            ...flow,
            data: flow.name === 'b' ? 123 : {},
          });
        }),
      }).then((flow) => {
        assert.deepEqual(keys, [undefined, 'a']);
        assert.deepEqual(names, [undefined, 'b']);

        assert.deepEqual(flow.data, { a: 123 });
      });
    });
  });
}
