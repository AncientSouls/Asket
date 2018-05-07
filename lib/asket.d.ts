export interface IQuery {
    variables?: IQueryVariables;
    fragments?: IQueryFragments;
    schema: IQuerySchema;
}
export interface IQueryVariables {
    [name: string]: any;
}
export interface IQueryFragments {
    [name: string]: IQuerySchema;
}
export interface IQuerySchema {
    name?: string;
    options?: IQueryOptions;
    fields?: IQueryFieldsList;
    fill?: boolean;
    use?: string;
    _used?: true;
}
export interface IQueryFieldsList {
    [field: string]: IQuerySchema;
}
export interface IQueryOptions {
    [name: string]: any;
}
export interface IQueryResolver {
    (IQueryFlow: any): Promise<IQueryFlow>;
}
export interface IQueryFlow {
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
export interface IQueryAsket {
    (flow: IQueryFlow): Promise<IQueryFlow>;
}
export declare const useSchema: (flow: any) => void;
export declare const asket: IQueryAsket;
