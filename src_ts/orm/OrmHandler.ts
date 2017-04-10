"use strict";

import * as libFsp from 'fs-promise';
import * as libPath from 'path';

import * as Waterline from "waterline";
interface Validated extends Waterline.Config{
  path: string;
}

import * as joi from 'joi';
const joiValidate = require('../utility/JoiValidate');



class OrmHandler {
  waterline: Waterline.Waterline;
  collections: any;
  schema: joi.ObjectSchema;
  constructor() {
    this.waterline = new Waterline();
    this.collections = {};

    this.schema = joi.object().keys({
      path:         joi.string().required(),
      adapters:     joi.object().required(),
      connections:  joi.object().required()
    });
  }

  initialize(conf: any) {
    let validated: Validated;
    return new Promise((resolve, reject) => {
      joiValidate(conf, this.schema).then((_: Validated) => {
        validated = _;
        return libFsp.stat(validated.path);
      }).then((stats: any) => {
        if (!stats.isDirectory()) {
          throw new Error('[OrmHandler] conf.path have to be a valid path!');
        } else if (!libPath.isAbsolute(validated.path)) {
          throw new Error('[OrmHandler] conf.path have to be an absolute path!');
        }
        return libFsp.readdir(validated.path);
      }).then((files: Array<string>) => {
        for (let file of files) {
          if (file === 'spec.js') {
            continue; // spec definition, skip it
          }
          let model = require(libPath.join(validated.path, file));
          this.waterline.loadCollection(Waterline.Collection.extend(model.register()));
        }
        this.waterline.initialize(validated, (err: Error, instance: Waterline.Ontology) => {
          if (err) {
            reject(err);
          } else {
            this.collections = instance.collections;
            resolve();
          }
        });
      }).catch((err: Error) => reject(err));
    });
  }

  getWaterlineModel(modelName: string) {
    if (this.collections.hasOwnProperty(modelName)) {
      return this.collections[modelName];
    } else {
      throw new Error(`[OrmHandler] Unknown waterline model: ${modelName}`);
    }
  }

}

export const ormInstance = new OrmHandler();
export interface ormInstanceType extends OrmHandler {};
// module.exports = orm;