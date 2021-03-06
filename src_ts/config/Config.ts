"use strict";

import * as joi from 'joi';
const joiValidate = require('../utility/JoiValidate');

import * as libPath from 'path';
import * as libFsp from 'fs-promise';
import * as libUtil from 'util';

export class Config {
  public schema: joi.ObjectSchema;
  private cache: {[key:string]: any};
  private path: string;
  private suffix: string;

  public constructor() {
    this.schema = joi.object().keys({
      path:   joi.string().required(),
      suffix: joi.string().optional().default('.json')
    }).required();

    this.cache = {};
  }

  public initialize(conf: any): Promise<any> {
    let validated = {path: "", suffix: ""};
    return new Promise((resolve, reject) => {
      joiValidate(conf, this.schema).then((_: any) => {
        validated = _;
        return libFsp.stat(validated.path);
      }).then((stats: any) => {
        if (!stats.isDirectory()) {
          throw new Error('[Config] conf.path have to be a valid path!');
        } else if (!libPath.isAbsolute(validated.path)) {
          throw new Error('[Config] conf.path have to be an absolute path!');
        }
        this.path   = validated.path;
        this.suffix = validated.suffix;
        resolve();
      }).catch((err: Error) => reject(err));
    });
  }

  private loadKey(fileName: string, key: string, path: string): void {
    let pathValidated = path || this.path; // optional

    this.loadJson(fileName, pathValidated).then((conf: any) => {
      if (conf.hasOwnProperty(key)) {
        return Promise.resolve(conf[key]);
      } else {
        return Promise.reject(new Error(libUtil.format('[Config] Key not found: %s - %s', fileName, key)));
      }
    }).catch((err) => {
      return Promise.reject(err);
    })
  }

  private loadJson(fileName: string, path: string): Promise<any> {
    let pathValidated = path || this.path; // optional
    return new Promise((resolve, reject) => {
      // exists in cache
      if (this.cache.hasOwnProperty(fileName)) {
        resolve(this.cache[fileName]);
      }

        // check file exists
      let filePath = libPath.join(pathValidated, fileName);
      libFsp.stat(filePath).then((stats: any) => {
        if (!stats.isFile()) {
          reject(new Error(libUtil.format('[Config] File not found: %s', filePath)));
        }
      });

      // read & parse file
      libFsp.readFile(filePath).then((content: any) => {
        try {
          let jsonData = JSON.parse(content);
          this.cache[fileName] = jsonData;
          resolve(jsonData);
        } catch (err) {
          reject(err);
        }
      }).catch((err: Error) => {
        reject(err);
      });
    
    });
  }

}

export const configInstance = new Config();

