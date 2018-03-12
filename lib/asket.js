"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const RSVP = require("rsvp");
const useSchema = (flow) => {
    if (flow.schema._used)
        return;
    flow.schema = _.has(flow, 'schema.use')
        ? flow.query.fragments[flow.schema.use] : flow.schema;
    flow.schema._used = true;
};
const asket = (flow) => {
    if (!flow.next)
        flow.next = asket;
    if (!flow.path)
        flow.path = [flow];
    if (!flow.query)
        flow.query = { schema: {} };
    if (!flow.schema)
        flow.schema = flow.query.schema;
    useSchema(flow);
    if (!flow.name)
        flow.name = _.get(flow, 'schema.name');
    return flow.resolver(flow).then((flow) => {
        if (!flow.stop) {
            if (_.isArray(flow.data)) {
                return RSVP.all(_.map(flow.data, (data, index) => {
                    const nextFlow = Object.assign({}, flow, { data, name: undefined, key: index, path: [...flow.path] });
                    nextFlow.path.push(nextFlow);
                    return flow.next(nextFlow).then(flow => flow.data);
                })).then(all => (Object.assign({}, flow, { data: all })));
            }
            if (_.has(flow.schema, 'fields') || _.isObject(flow.data)) {
                return RSVP.hash(_.mapValues(flow.schema.fields, (fieldSchema, key) => {
                    const nextFlow = Object.assign({}, flow, { key, schema: fieldSchema, path: [...flow.path] });
                    useSchema(nextFlow);
                    nextFlow.name = _.get(fieldSchema, 'name') || _.get(nextFlow.schema, 'name') || key;
                    nextFlow.data = _.get(flow.data, nextFlow.name);
                    nextFlow.path.push(nextFlow);
                    return flow.next(nextFlow).then(flow => flow.data);
                })).then((hash) => {
                    const nextData = _.isObject(flow.data) && flow.schema.fill
                        ? _.extend(hash, flow.data) : hash;
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