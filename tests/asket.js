"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const _ = require("lodash");
const asket_1 = require("../lib/asket");
function default_1() {
    describe('asket()', () => {
        it(`fields`, () => {
            const keys = [];
            const names = [];
            return asket_1.asket({
                query: { schema: { fields: {
                            a: {}, b: {}, c: {},
                        } } },
                resolver: flow => new Promise((resolve) => {
                    keys.push(flow.key);
                    names.push(flow.name);
                    resolve(Object.assign({}, flow, { data: (flow.name === 'a' ? {}
                            : (flow.name === 'b' ? { x: 'y' }
                                : (flow.name === 'c' ? 123 : {}))) }));
                }),
            }).then((flow) => {
                chai_1.assert.deepEqual(keys, [undefined, 'a', 'b', 'c']);
                chai_1.assert.deepEqual(names, [undefined, 'a', 'b', 'c']);
                chai_1.assert.deepEqual(flow.data, { a: {}, b: {}, c: 123 });
            });
        });
        it(`arrays`, () => {
            const keys = [];
            const names = [];
            return asket_1.asket({
                query: { schema: { fields: { a: { fields: { b: { fields: { c: {} } } } } },
                    } },
                resolver: flow => new Promise((resolve) => {
                    keys.push(flow.key);
                    names.push(flow.name);
                    resolve(Object.assign({}, flow, { data: flow.name === 'a' ? [123, 234] : 345 }));
                }),
            }).then((flow) => {
                chai_1.assert.deepEqual(keys, [undefined, 'a', 0, 1, 'b', 'b', 'c', 'c']);
                chai_1.assert.deepEqual(names, [undefined, 'a', undefined, undefined, 'b', 'b', 'c', 'c']);
                chai_1.assert.deepEqual(flow.data, { a: [{ b: { c: 345 } }, { b: { c: 345 } }] });
            });
        });
        it(`not in fields`, () => {
            const keys = [];
            const names = [];
            return asket_1.asket({
                query: { schema: { fields: { a: {} } } },
                resolver: flow => new Promise((resolve) => {
                    keys.push(flow.key);
                    names.push(flow.name);
                    resolve(Object.assign({}, flow, { data: flow.path.length === 1 ? { a: 234, b: 345 } : flow.data }));
                }),
            }).then((flow) => {
                chai_1.assert.deepEqual(keys, [undefined, 'a']);
                chai_1.assert.deepEqual(names, [undefined, 'a']);
                chai_1.assert.deepEqual(flow.data, { a: 234 });
            });
        });
        it(`fill`, () => {
            const keys = [];
            const names = [];
            return asket_1.asket({
                query: { schema: { fields: { a: {} }, fill: true } },
                resolver: flow => new Promise((resolve) => {
                    keys.push(flow.key);
                    names.push(flow.name);
                    resolve(Object.assign({}, flow, { data: flow.path.length === 1 ? { a: 234, b: 345 } : flow.data }));
                }),
            }).then((flow) => {
                chai_1.assert.deepEqual(keys, [undefined, 'a']);
                chai_1.assert.deepEqual(names, [undefined, 'a']);
                chai_1.assert.deepEqual(flow.data, { a: 234, b: 345 });
            });
        });
        it(`options`, () => {
            const keys = [];
            const names = [];
            return asket_1.asket({
                query: { schema: { options: { key: 'a' }, fill: true } },
                resolver: flow => new Promise((resolve) => {
                    keys.push(flow.key);
                    names.push(flow.name);
                    resolve(Object.assign({}, flow, { data: { [flow.schema.options.key]: 123 } }));
                }),
            }).then((flow) => {
                chai_1.assert.deepEqual(keys, [undefined]);
                chai_1.assert.deepEqual(names, [undefined]);
                chai_1.assert.deepEqual(flow.data, { a: 123 });
            });
        });
        it(`variables`, () => {
            const keys = [];
            const names = [];
            return asket_1.asket({
                query: {
                    variables: { x: 345 },
                    schema: { fields: { a: { options: { y: 'x' } } } },
                },
                resolver: flow => new Promise((resolve) => {
                    keys.push(flow.key);
                    names.push(flow.name);
                    resolve(Object.assign({}, flow, { data: flow.path.length === 1 ? {} : flow.query.variables[flow.schema.options.y] }));
                }),
            }).then((flow) => {
                chai_1.assert.deepEqual(keys, [undefined, 'a']);
                chai_1.assert.deepEqual(names, [undefined, 'a']);
                chai_1.assert.deepEqual(flow.data, { a: 345 });
            });
        });
        it(`fragment`, () => {
            const keys = [];
            const names = [];
            return asket_1.asket({
                query: {
                    fragments: {
                        x: { name: 'z', fields: { y: {} } },
                        g: { fields: { h: {} } },
                    },
                    schema: { fields: {
                            a: { use: 'x' },
                            b: { name: 'e', use: 'x' },
                            c: { use: 'g' },
                        } },
                },
                resolver: flow => new Promise((resolve) => {
                    keys.push(flow.key);
                    names.push(flow.name);
                    resolve(Object.assign({}, flow, { data: 123 }));
                }),
            }).then((flow) => {
                chai_1.assert.deepEqual(keys, [undefined, 'a', 'b', 'c', 'y', 'y', 'h']);
                chai_1.assert.deepEqual(names, [undefined, 'z', 'e', 'c', 'y', 'y', 'h']);
                chai_1.assert.deepEqual(flow.data, {
                    a: { y: 123 },
                    b: { y: 123 },
                    c: { h: 123 },
                });
            });
        });
        it(`recursion`, () => {
            const keys = [];
            const names = [];
            return asket_1.asket({
                query: {
                    fragments: { x: { fields: { y: { use: 'x' } } } },
                    schema: { fields: { a: { use: 'x' } } },
                },
                resolver: flow => new Promise((resolve) => {
                    keys.push(flow.key);
                    names.push(flow.name);
                    resolve(Object.assign({}, flow, { data: 123, stop: flow.path.length > 6 }));
                }),
            }).then((flow) => {
                chai_1.assert.deepEqual(keys, [undefined, 'a', 'y', 'y', 'y', 'y', 'y']);
                chai_1.assert.deepEqual(names, [undefined, 'a', 'y', 'y', 'y', 'y', 'y']);
                chai_1.assert.deepEqual(flow.data, { a: { y: { y: { y: { y: { y: 123 } } } } } });
            });
        });
        it(`ovveride schema`, () => {
            const keys = [];
            const names = [];
            return asket_1.asket({
                query: {
                    schema: { fields: { a: {} } },
                },
                resolver: flow => new Promise((resolve) => {
                    keys.push(flow.key);
                    names.push(flow.name);
                    const schema = flow.path.length === 1
                        ? _.merge({}, flow.schema, { fields: { c: {} } })
                        : flow.schema;
                    resolve(Object.assign({}, flow, { schema, data: flow.path.length === 1 ? { a: 123, b: 234, c: 345 } : flow.data }));
                }),
            }).then((flow) => {
                chai_1.assert.deepEqual(keys, [undefined, 'a', 'c']);
                chai_1.assert.deepEqual(names, [undefined, 'a', 'c']);
                chai_1.assert.deepEqual(flow.data, { a: 123, c: 345 });
            });
        });
        it(`aliases`, () => {
            const keys = [];
            const names = [];
            return asket_1.asket({
                query: {
                    schema: { fields: { a: { name: 'b' } } },
                },
                resolver: flow => new Promise((resolve) => {
                    keys.push(flow.key);
                    names.push(flow.name);
                    resolve(Object.assign({}, flow, { data: flow.name === 'b' ? 123 : {} }));
                }),
            }).then((flow) => {
                chai_1.assert.deepEqual(keys, [undefined, 'a']);
                chai_1.assert.deepEqual(names, [undefined, 'b']);
                chai_1.assert.deepEqual(flow.data, { a: 123 });
            });
        });
    });
}
exports.default = default_1;
//# sourceMappingURL=asket.js.map