"use strict";

import {ormInstance as orm} from './OrmHandler';
import {cacheInstance as cache} from '../cache/Cache';
import {loggerInstance as logger} from '../logger/Logger';
import * as joi from 'joi';

class OrmModel {
  private name: string;
  private cacheKey: string;
  private schema: any;
  public constructor() {
    this.name         = '';   // model name
    this.cacheKey     = '';   // model identity attribute name
    this.schema       = {};   // waterline model definition schema object
  }

  public get instance() {
    return orm.getWaterlineModel(this.name);
  }

  public register(): any {
    this.checkAfterChangeEventDefinition('afterCreate');
    this.checkAfterChangeEventDefinition('afterUpdate');
    this.checkAfterChangeEventDefinition('afterDestroy');

    return this.schema;
  }

  public find(identity: any, query: any): Promise<any> {
    let cacheHit = false;
    let queryString = JSON.stringify(query);

    return new Promise((resolve, reject) => {
      cache.getModelHash(this.name, identity, queryString).then((data: any) => {
        if (data) {
          cacheHit = true;
          return Promise.resolve(data);
        } else {
          return this.instance.find(query);
        }
      }).then((data: any) => {
        if (data && !cacheHit) {
          return cache.setModelHash(this.name, identity, queryString, data);
        } else {
          return Promise.resolve(data);
        }
      }).then((data: any) => {
        resolve(data);
      }).catch((err: Error) => {
        reject(err);
      });
    });
  }

  public getCacheKeyVal(values: any): any {
    if (Array.isArray(values)) {
      return values[0][this.cacheKey];
    } else {
      return values[this.cacheKey];
    }
  }

  public static getValByKey(key: string, values: any): any {
    if (Array.isArray(values)) {
      return values[0][key];
    } else {
      return values[key];
    }
  }

  public checkAfterChangeEventDefinition(eventName: string): void {
    if (!this.schema.hasOwnProperty(eventName)) {
      let me: any = this;
      this.schema[eventName] = me[eventName];
    }
  }

  public static removeCacheAfterRecordChanged(name: string, cacheKey: string, data: any, next: any): void {
    cache.removeModelHash(name, OrmModel.getValByKey(cacheKey, data))
      .then((_: any) => next())
      .catch((err: Error) => {
        logger.error(err);
        next();
      });
  }

}

module.exports = OrmModel;
