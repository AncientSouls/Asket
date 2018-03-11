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
  ): Promise<IQueryResult>;
}

interface IQueryResult {
  data?: any;
  env?: any;
}

interface IQueryStep {
  key: string|number;
  data: any;
  schema: IQuerySchema;
}

class Asket {
  constructor(
    public query?: IQuery,
    public resolver?: IQueryResolver,
    public env?: any,
    public data?: any,
  ) {}

  exec(): Promise<IQueryResult> {
    return this.resolver(this.query.schema, this.data, this.env, [])
    .then(({ data, env }) => this.execSchema(this.query.schema, data, env, []));
  }

  execSchema(
    schema: IQuerySchema,
    data: any,
    env: any,
    steps: IQueryStep[],
  ): Promise<IQueryResult> {
    let result;
    if (schema.fields || schema.fill || schema.options) {
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
        [..._.clone(steps), { key, data, schema }],
      ).then(({ data }) => data))).then(data => ({ data, env }));
    }
    return RSVP.hash(_.mapValues(schema.fields, (schema, key) => {
      const nextSteps = [..._.clone(steps), { key, data, schema }];
      return this.resolver(schema, _.get(data, key), env, nextSteps)
      .then(({ data, env }) => {
        return this.execSchema(
          schema, data, env,
          nextSteps,
        );
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
