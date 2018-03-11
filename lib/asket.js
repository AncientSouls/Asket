"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const RSVP = require("rsvp");
const asket = (flow) => {
    if (!flow.next)
        flow.next = asket;
    if (!flow.schema)
        flow.schema = flow.query.schema;
    if (!flow.path)
        flow.path = [flow];
    return flow.resolver(flow).then((flow) => {
        const schema = _.has(flow, 'schema.use') ? flow.query.fragments[flow.schema.use] : flow.schema;
        if (!flow.stop) {
            if (_.isArray(flow.data)) {
                return RSVP.all(_.map(flow.data, (data, index) => {
                    const nextFlow = Object.assign({}, flow, { data, name: undefined, key: index, path: [...flow.path] });
                    nextFlow.path.push(nextFlow);
                    return flow.next(nextFlow).then(flow => flow.data);
                })).then(all => (Object.assign({}, flow, { data: all })));
            }
            if (_.has(schema, 'fields') || _.isObject(flow.data)) {
                return RSVP.hash(_.mapValues(schema.fields, (fieldSchema, key) => {
                    const name = fieldSchema.name || key;
                    const nextFlow = Object.assign({}, flow, { key, name, data: _.get(flow.data, name), schema: fieldSchema, path: [...flow.path] });
                    nextFlow.path.push(nextFlow);
                    return flow.next(nextFlow).then(flow => flow.data);
                })).then((hash) => {
                    const nextData = _.isObject(flow.data) && schema.fill ? _.extend(hash, flow.data) : hash;
                    const nextFlow = Object.assign({}, flow, { data: nextData });
                    return nextFlow;
                });
            }
        }
        return new Promise(resolve => resolve(flow));
    });
};
exports.default = asket;
exports.asket = asket;
//# sourceMappingURL=asket.js.map