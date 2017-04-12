"use strict";

import * as libPath from 'path';

const handlebars  = require('handlebars');

import * as joi from 'joi';
const joiValidate = require('../utility/JoiValidate');

export interface HandlebarsInterface {
  cache: any;
  schema: joi.ObjectSchema;
}

export class Handlebars {
  private cache: any;
  public schema: joi.ObjectSchema;
  public constructor() {
    this.cache = {};

    this.schema = joi.object().keys({}).optional();
  }

  public initialize(conf: any): Promise<void> {
    return Promise.resolve();
  }

  public render(fileName: string, args: any): void {

  }

}

export const templateInstance = new Handlebars();