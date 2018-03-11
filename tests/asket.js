"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const asket_1 = require("../lib/asket");
function default_1() {
    describe('Asket:', () => {
        it(`fields not exists`, () => new asket_1.Asket({ schema: {} }, () => new Promise(r => r({ data: 123 }))).exec().then(({ data }) => {
            chai_1.assert.deepEqual(data, 123);
        }));
        it(`fields empty`, () => new asket_1.Asket({ schema: { fields: {} } }, () => new Promise(r => r({ data: 123 }))).exec().then(({ data }) => {
            chai_1.assert.deepEqual(data, {});
        }));
        it(`fields simple`, () => new asket_1.Asket({ schema: { fields: { a: {} } } }, () => new Promise(r => r({ data: 123 }))).exec().then(({ data }) => {
            chai_1.assert.deepEqual(data, { a: 123 });
        }));
        it(`arrays`, () => new asket_1.Asket({ schema: { fields: { a: { fields: { b: { fields: { c: {} } } } } } } }, (schema, data, env, steps) => new Promise((r) => {
            if (steps.length === 1) {
                r({ data: [123, 123] });
            }
            else {
                r({ data: 123 });
            }
        })).exec().then(({ data }) => {
            chai_1.assert.deepEqual(data, { a: [{ b: { c: 123 } }, { b: { c: 123 } }] });
        }));
        it(`not in fields`, () => new asket_1.Asket({ schema: { fields: { a: {} } } }, (schema, data, env, steps) => new Promise((r) => {
            if (!steps.length) {
                r({ data: { a: 234, b: 345 } });
            }
            else {
                r({ data: 123 });
            }
        })).exec().then(({ data }) => {
            chai_1.assert.deepEqual(data, { a: 123 });
        }));
        it(`fill`, () => new asket_1.Asket({ schema: { fields: { a: {} }, fill: true } }, (schema, data, env, steps) => new Promise((r) => {
            if (!steps.length) {
                r({ data: { a: 234, b: 345 } });
            }
            else {
                r({ data: 123 });
            }
        })).exec().then(({ data }) => {
            chai_1.assert.deepEqual(data, { a: 123, b: 345 });
        }));
        it(`options`, () => new asket_1.Asket({ schema: { options: { key: 'abc' }, fill: true } }, (schema, data, env, steps) => new Promise((r) => {
            r({ data: { [schema.options.key]: 123 } });
        })).exec().then(({ data }) => {
            chai_1.assert.deepEqual(data, { abc: 123 });
        }));
        it(`variables`, () => new asket_1.Asket({ variables: { x: 345 }, schema: { fields: { a: { options: { y: 'x' } } } } }, function (schema, data, env, steps) {
            return new Promise((r) => {
                if (!steps.length) {
                    r({ data: {} });
                }
                else {
                    r({ data: this.query.variables[schema.options.y] });
                }
            });
        }).exec().then(({ data }) => {
            chai_1.assert.deepEqual(data, { a: 345 });
        }));
        it(`fragment`, () => new asket_1.Asket({ fragments: { x: { fields: { y: {} } } }, schema: { fields: { a: { fragment: 'x' } } } }, (schema, data, env, steps) => new Promise((r) => {
            r({ data: 123 });
        })).exec().then(({ data }) => {
            chai_1.assert.deepEqual(data, { a: { y: 123 } });
        }));
        it(`recursion`, () => new asket_1.Asket({
            fragments: { x: { fields: { y: { fragment: 'x' } } } },
            schema: { fields: { a: { fragment: 'x' } } },
        }, (schema, data, env, steps) => new Promise((r) => {
            r({ data: 123, dontExec: steps.length > 5 });
        })).exec().then(({ data }) => {
            chai_1.assert.deepEqual(data, { a: { y: { y: { y: { y: { y: 123 } } } } } });
        }));
    });
}
exports.default = default_1;
//# sourceMappingURL=asket.js.map