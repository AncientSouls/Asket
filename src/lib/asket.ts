import * as _ from 'lodash';
import * as RSVP from 'rsvp';

interface IQuery {
  variables?: IQueryVariables;
  fragments?: IQueryFragments;
  schema: IQuerySchema;
}

interface IQueryVariables {
  [name: string]: any;
}

interface IQueryFragments {
  [name: string]: IQuerySchema;
}

interface IQuerySchema {
  name?: string;
  options?: IQueryOptions;
  fields?: IQueryFieldsList;
  fill?: boolean;
  use?: string;
}

interface IQueryFieldsList {
  [field: string]: IQuerySchema;
}

interface IQueryOptions {
  [name: string]: any;
}

interface IQueryResolver {
  (IQueryFlow): Promise<IQueryFlow>;
}

interface IQueryFlow {
  next?: IQueryAsket;
  resolver: IQueryResolver;
  data?: any;
  env?: any;
  stop?: boolean;
  query: IQuery;
  schema?: IQuerySchema;
  path?: IQueryFlow[];
  key?: string|number;
  name?: string|number;
}

interface IQueryAsket {
  (flow: IQueryFlow): Promise<IQueryFlow>;
}

const asket: IQueryAsket = (flow) => {
  if (!flow.next) flow.next = asket;
  if (!flow.schema) flow.schema = flow.query.schema;
  if (!flow.path) flow.path = [flow];
  return flow.resolver(flow).then((flow) => {
    const schema = _.has(flow, 'schema.use') ? flow.query.fragments[flow.schema.use] : flow.schema;

    if (!flow.stop) {

      if (_.isArray(flow.data)) {
        return RSVP.all(_.map(flow.data, (data, index) => {
          const nextFlow = {
            ...flow,
            data,
            name: undefined,
            key: index,
            path: [...flow.path],
          };
          nextFlow.path.push(nextFlow);
          return flow.next(nextFlow).then(flow => flow.data);
        })).then(all => ({ ...flow, data: all }));
      }
      
      if (_.has(schema, 'fields') || _.isObject(flow.data)) {
        return RSVP.hash(_.mapValues(schema.fields, (fieldSchema, key) => {
          const name = fieldSchema.name || key;
          
          const nextFlow = {
            ...flow,
            key, name,
            data: _.get(flow.data, name),
            schema: fieldSchema,
            path: [...flow.path],
          };
          nextFlow.path.push(nextFlow);
          return flow.next(nextFlow).then(flow => flow.data);
        })).then((hash) => {
          const nextData = _.isObject(flow.data) && schema.fill ? _.extend(hash, flow.data) : hash;
          const nextFlow = { ...flow, data: nextData };
          return nextFlow;
        });
      }

    }
    
    return new Promise(resolve => resolve(flow));
  });
};

export {
  asket as default,
  asket,
  IQuery,
  IQueryAsket,
  IQueryVariables,
  IQueryFragments,
  IQuerySchema,
  IQueryFieldsList,
  IQueryOptions,
  IQueryResolver,
  IQueryFlow,
};
