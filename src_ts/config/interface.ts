import * as joi from 'joi';
export interface ConfigInterface {
    schema: joi.ObjectSchema;
    cache: {[key:string]: any};
    path: string;
    suffix: string;
    // initialize(conf: any): Promise<any>;
    // loadKey(fileName: string, key: string, path: string): any;
    // loadJson(fileName: string, path: string): Promise<any>;
}