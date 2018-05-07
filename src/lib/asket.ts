import * as _ from 'lodash';
import * as RSVP from 'rsvp';

export interface IQuery {
  /** 
   * Global container of some data, which can be used in any part of resolver logic.
  */
  variables?: IQueryVariables;

  /** 
   * Pieces of query for reusing in schema.
  */
  fragments?: IQueryFragments;

  /** 
   * Body of query, which is need to be parsed, mutated, and etc.
  */
  schema: IQuerySchema;
}

export interface IQueryVariables {
  [name: string]: any;
}

export interface IQueryFragments {
  [name: string]: IQuerySchema;
}

export interface IQuerySchema {
  /** 
   * Local name of current deep's level in schema.
  */
  name?: string;

  /** 
   * Local container of some data, which can be used in any part of resolver logic.
  */
  options?: IQueryOptions;

  /** 
   * Structure of this level.
  */
  fields?: IQueryFieldsList;

  /** 
   * Should resolver to fill data with keys, which are not exists in schema?
  */
  fill?: boolean;

  /** 
   * Use here fragmet of query.
  */
  use?: string;

  /** 
   * Does this level already used in resolver?
  */
  _used?: true;
}

export interface IQueryFieldsList {
  [field: string]: IQuerySchema;
}

export interface IQueryOptions {
  [name: string]: any;
}

export interface IQueryResolver {
  (IQueryFlow): Promise<IQueryFlow>;
}

export interface IQueryFlow {
  /** 
   * `Asket()` in order to go to next deep's level.
  */
  next?: IQueryAsket;

  /** 
   * Getter and data handler.
  */
  resolver: IQueryResolver;

  /** 
   * Some data of this level.
  */
  data?: any;

  /** 
   * Context for resolver.
  */
  env?: any;

  /** 
   * Instruction from resolver to stop work.
  */
  stop?: boolean;

  /** 
   * Original query, which started procces.
  */
  query?: IQuery;

  /** 
   * Schema of current deep's level.
  */
  schema?: IQuerySchema;

  /** 
   * Structure of all flows.
  */
  path?: IQueryFlow[];

  /** 
   * Key of this level in schema.
  */
  key?: string|number;

  /** 
   * Name of this level in schema. (Key by default, if name is not specified)
  */
  name?: string|number;
}

export interface IQueryAsket {
  (flow: IQueryFlow): Promise<IQueryFlow>;
}

/** 
 * Mark this level as already used.
*/
export const useSchema = (flow) => {
  if (flow.schema._used) return;
  flow.schema = _.has(flow, 'schema.use')
  ? flow.query.fragments[flow.schema.use] : flow.schema;
  flow.schema._used = true;
};

export const asket: IQueryAsket = (flow) => {
  if (!flow.next) flow.next = asket;
  if (!flow.path) flow.path = [flow];
  if (!flow.query) flow.query = { schema: {} };
  if (!flow.schema) flow.schema = flow.query.schema;
  useSchema(flow);
  if (!flow.name) flow.name = _.get(flow, 'schema.name');
  
  return flow.resolver(flow).then((flow) => {
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
      
      if (_.has(flow.schema, 'fields') || _.isObject(flow.data)) {
        return RSVP.hash(_.mapValues(flow.schema.fields, (fieldSchema, key) => {
          const nextFlow = {
            ...flow,
            key,
            schema: fieldSchema,
            path: [...flow.path],
          };
          useSchema(nextFlow);
          nextFlow.name = _.get(fieldSchema, 'name') || _.get(nextFlow.schema, 'name') || key;
          nextFlow.data = _.get(flow.data, nextFlow.name);
          nextFlow.path.push(nextFlow);
          return flow.next(nextFlow).then(flow => flow.data);
        })).then((hash) => {
          const nextData = _.isObject(flow.data) && flow.schema.fill
          ? _.extend(hash, flow.data) : hash;
          const nextFlow = { ...flow, data: nextData };
          return nextFlow;
        });
      }

    }
    
    return new Promise(resolve => resolve(flow));
  });
};
