"use strict";

import * as libPath from 'path';

const handlebars  = require('handlebars');

import * as joi from 'joi';
const joiValidate = require('../utility/JoiValidate');

export interface HandlebarsInterface {
  cache: any;
  schema: joi.ObjectSchema;
}

export class Handlebars implements HandlebarsInterface {
  cache: any;
  schema: joi.ObjectSchema;
  constructor() {
    this.cache = {};

    this.schema = joi.object().keys({}).optional();
  }

  initialize(conf: any) {
    return Promise.resolve();
  }

  render(fileName: string, args: any) {

  }

}

export const templateInstance = new Handlebars();