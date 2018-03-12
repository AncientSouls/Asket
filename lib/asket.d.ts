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
    _used?: true;
}
interface IQueryFieldsList {
    [field: string]: IQuerySchema;
}
interface IQueryOptions {
    [name: string]: any;
}
interface IQueryResolver {
    (IQueryFlow: any): Promise<IQueryFlow>;
}
interface IQueryFlow {
    next?: IQueryAsket;
    resolver: IQueryResolver;
    data?: any;
    env?: any;
    stop?: boolean;
    query?: IQuery;
    schema?: IQuerySchema;
    path?: IQueryFlow[];
    key?: string | number;
    name?: string | number;
}
interface IQueryAsket {
    (flow: IQueryFlow): Promise<IQueryFlow>;
}
declare const asket: IQueryAsket;
export { asket as default, asket, IQuery, IQueryAsket, IQueryVariables, IQueryFragments, IQuerySchema, IQueryFieldsList, IQueryOptions, IQueryResolver, IQueryFlow };
