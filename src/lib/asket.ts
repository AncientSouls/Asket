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
  fields?: IQueryFields;
  fill?: boolean;
  fragment?: string;
}

interface IQueryFields {
  [field: string]: IQuerySchema;
}

interface IQueryOptions {
  [name: string]: any;
}

interface IQueryResolver {
  (
    schema: IQuerySchema,
    data: any,
    env: any,
    steps: IQueryStep[],
    name: string|number,
  ): Promise<IQueryResult>;
}

interface IQueryResult {
  data?: any;
  env?: any;
  dontExec?: boolean;
  requiredSchema?: IQuerySchema;
  schema?: IQuerySchema;
  steps?: IQueryStep[];
}

interface IQueryStep {
  key: string|number;
  data: any;
  schema: IQuerySchema;
  name: string|number;
}

class Asket {
  constructor(
    public query?: IQuery,
    public resolver?: IQueryResolver,
    public env?: any,
    public data?: any,
  ) {}

  exec(): Promise<IQueryResult> {
    return this.execResolver(this.query.schema, this.data, this.env, [])
    .then(({ schema, data, env, steps }) => this.execSchema(schema, data, env, steps));
  }

  execResolver(
    schema: IQuerySchema,
    data: any,
    env: any,
    steps: IQueryStep[],
  ): Promise<IQueryResult> {
    return this.resolver(schema, data, env, steps, _.get(_.last(steps),'name'))
    .then(({ data, env, requiredSchema, dontExec }) => {
      let newSchema = schema;
      if (requiredSchema) {
        if (_.isObject(schema)) {
          newSchema = _.merge({}, schema, requiredSchema);
        } else {
          newSchema = requiredSchema;
        }
      }
      return {
        data, env, requiredSchema, dontExec, steps,
        schema: newSchema,
      };
    });
  }

  execSchema(
    schema: IQuerySchema,
    data: any,
    env: any,
    steps: IQueryStep[],
  ): Promise<IQueryResult> {
    let result;
    if (schema.fields || schema.fill) {
      result = this.execFragment(schema, data, env, steps);
    } else if (schema.fragment) {
      result = this.execFragment(this.query.fragments[schema.fragment], data, env, steps);
    } else {
      result = new Promise(resolve => resolve({ data, env }));
    }
    return result.then(({ data: d, env }) => {
      if (schema.fill && _.isObject(data) && _.isObject(d)) {
        return { env, data: _.extend({}, data, d) };
      }
      return { env, data: d };
    });
  }

  execFragment(
    schema: IQuerySchema,
    data: any,
    env: any,
    steps: IQueryStep[],
  ): Promise<IQueryResult> {
    if (_.isArray(data)) {
      return RSVP.all(_.map(data, (data, key) => this.execSchema(
        schema, data, env,
        [..._.clone(steps), { key, data, schema, name: key }],
      ).then(({ data }) => data))).then(data => ({ data, env }));
    }
    return RSVP.hash(_.mapValues(schema.fields, (schema, key) => {
      const nextSteps = [..._.clone(steps), { key, data, schema, name: schema.name || key }];
      return this.execResolver(schema, _.get(data, schema.name || key), env, nextSteps)
      .then(({ schema, data, env, steps, dontExec }) => {
        if (dontExec) return new Promise(r => r({ data, env }));
        return this.execSchema(schema, data, env, steps);
      }).then(({ data }) => data);
    })).then(data => ({ data, env }));
  }
}

export {
  Asket as default,
  Asket,
  IQuery,
  IQueryVariables,
  IQueryFragments,
  IQuerySchema,
  IQueryFields,
  IQueryOptions,
  IQueryResolver,
  IQueryResult,
  IQueryStep,
};
