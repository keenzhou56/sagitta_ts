import * as joi from 'joi';
export interface CacheInterface {
    instance: any;
    schema: joi.ObjectSchema;
    variance: number;
    expires: number;
    // initialize(conf: any): Promise<any>;
    // setModelHash(modelName: any, identity: any, queryString: any, data: any, expires?: any): Promise<any>;
    // getModelHash(modelName: string, identity: any, queryString: any): Promise<any>;
    // removeModelHash(modelName: string, identity: any): Promise<any>;
    // setExpire(key: string, expires: any): Object;
    // // genModelKey(modelName: string, identity: any): string;
    // genExpire(expires: number): number;
    // // getRandomArbitrary(min: number, max: number): number;
}