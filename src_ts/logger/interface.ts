import * as joi from 'joi';
export interface LoggerInterface {
    conf: {[key:string]: any};
    instance: any;
    initialized: boolean;
    levels: {[key:string]: number};
    colors: {[key:string]: string};
    schema: joi.ObjectSchema;
}