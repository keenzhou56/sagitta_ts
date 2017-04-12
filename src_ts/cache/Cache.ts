"use strict";

import * as Redis from 'ioredis';
import * as joi from 'joi';
const joiValidate = require('../utility/JoiValidate');
import * as msgpack from 'msgpack-lite';

export class Cache {
  private instance: any;
  public schema: joi.ObjectSchema;
  private variance: number;
  private expires: number;
  public constructor() {
    //this.instance = new Redis();
    this.schema = joi.object().keys({
      host:     joi.string().ip().optional().default('127.0.0.1'),
      port:     joi.number().integer().optional().default(6379),
      family:   joi.number().integer().optional().valid([4, 6]).default(4),
      password: joi.string().optional(),
      db:       joi.number().integer().optional().default(0)
    }).optional();

    this.variance = 10;
    this.expires = 18000; // 5 hours = 5 * 60 * 60 seconds
  }

  public initialize(conf: any): Promise<any> {
    return new Promise((resolve, reject) => {
      joiValidate(conf, this.schema).then((validated: any) => {
        this.instance = new Redis(validated);
        resolve();
      }).catch((err: Error) => reject(err));
    });
  }

  public setModelHash(modelName: any, identity: any, queryString: any, data: any, expires?: any): Promise<any> {
    let key = Cache.genModelKey(modelName, identity);
    return new Promise((resolve, reject) => {
      this.instance.pipeline()
        .hset(key, queryString, msgpack.encode(data))
        .expire(key, this.genExpire(expires))
        .exec()
        .then((results: any) => { // results: [[null, 1], [null, 1]]
          results.forEach((result: any) => { // result: [null, 1]
            if (result[0]) {
              reject(result[0]); // err
            }
          });
          resolve(data); // data itself resolved
        });
    });
  }

  public getModelHash(modelName: string, identity: any, queryString: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.instance.hgetBuffer(Cache.genModelKey(modelName, identity), queryString).then((data: any) => {
        if (data !== null) {
            data = msgpack.decode(data);
        }
        resolve(data);
      }).catch((err: Error) => {
        reject(err);
      });
    });
  }

  public removeModelHash(modelName: string, identity: any): any {
    return this.instance.del(Cache.genModelKey(modelName, identity));
  }

  public setExpire(key: string, expires: any): any {
    return this.instance.expire(key, this.genExpire(expires));
  }

  public static genModelKey(modelName: string, identity: any): string {
    return `${modelName}:${identity}`;
  }

  public genExpire(expires: number): number {
    expires = expires || this.expires;

    let varianceMin = 0;
    let varianceMax = expires * 0.02 * this.variance;
    let varianceMinus = expires * 0.01 * this.variance;

    return Math.floor(expires + Cache.getRandomArbitrary(varianceMin, varianceMax) - varianceMinus);
  }

  public static getRandomArbitrary(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

}

export const cacheInstance = new Cache()
