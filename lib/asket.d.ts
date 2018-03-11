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
    (schema: IQuerySchema, data: any, env: any, steps: IQueryStep[], name: string | number): Promise<IQueryResult>;
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
    key: string | number;
    data: any;
    schema: IQuerySchema;
    name: string | number;
}
declare class Asket {
    query: IQuery;
    resolver: IQueryResolver;
    env: any;
    data: any;
    constructor(query?: IQuery, resolver?: IQueryResolver, env?: any, data?: any);
    exec(): Promise<IQueryResult>;
    execResolver(schema: IQuerySchema, data: any, env: any, steps: IQueryStep[]): Promise<IQueryResult>;
    execSchema(schema: IQuerySchema, data: any, env: any, steps: IQueryStep[]): Promise<IQueryResult>;
    execFragment(schema: IQuerySchema, data: any, env: any, steps: IQueryStep[]): Promise<IQueryResult>;
}
export { Asket as default, Asket, IQuery, IQueryVariables, IQueryFragments, IQuerySchema, IQueryFields, IQueryOptions, IQueryResolver, IQueryResult, IQueryStep };
