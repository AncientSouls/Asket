"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const RSVP = require("rsvp");
class Asket {
    constructor(query, resolver, env, data) {
        this.query = query;
        this.resolver = resolver;
        this.env = env;
        this.data = data;
    }
    exec() {
        return this.execResolver(this.query.schema, this.data, this.env, [])
            .then(({ schema, data, env, steps }) => this.execSchema(schema, data, env, steps));
    }
    execResolver(schema, data, env, steps) {
        return this.resolver(schema, data, env, steps, _.get(_.last(steps), 'name'))
            .then(({ data, env, requiredSchema, dontExec }) => {
            let newSchema = schema;
            if (requiredSchema) {
                if (_.isObject(schema)) {
                    newSchema = _.merge({}, schema, requiredSchema);
                }
                else {
                    newSchema = requiredSchema;
                }
            }
            return {
                data, env, requiredSchema, dontExec, steps,
                schema: newSchema,
            };
        });
    }
    execSchema(schema, data, env, steps) {
        let result;
        if (schema.fields || schema.fill) {
            result = this.execFragment(schema, data, env, steps);
        }
        else if (schema.fragment) {
            result = this.execFragment(this.query.fragments[schema.fragment], data, env, steps);
        }
        else {
            result = new Promise(resolve => resolve({ data, env }));
        }
        return result.then(({ data: d, env }) => {
            if (schema.fill && _.isObject(data) && _.isObject(d)) {
                return { env, data: _.extend({}, data, d) };
            }
            return { env, data: d };
        });
    }
    execFragment(schema, data, env, steps) {
        if (_.isArray(data)) {
            return RSVP.all(_.map(data, (data, key) => this.execSchema(schema, data, env, [..._.clone(steps), { key, data, schema, name: key }]).then(({ data }) => data))).then(data => ({ data, env }));
        }
        return RSVP.hash(_.mapValues(schema.fields, (schema, key) => {
            const nextSteps = [..._.clone(steps), { key, data, schema, name: schema.name || key }];
            return this.execResolver(schema, _.get(data, schema.name || key), env, nextSteps)
                .then(({ schema, data, env, steps, dontExec }) => {
                if (dontExec)
                    return new Promise(r => r({ data, env }));
                return this.execSchema(schema, data, env, steps);
            }).then(({ data }) => data);
        })).then(data => ({ data, env }));
    }
}
exports.default = Asket;
exports.Asket = Asket;
//# sourceMappingURL=asket.js.map