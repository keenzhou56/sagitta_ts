"use strict";

import * as libPath from 'path';

const handlebars  = require('handlebars');

import * as joi from 'joi';
const joiValidate = require('../utility/JoiValidate');

class Handlebars {
  cache: any;
  schema: any;
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
export interface templateInstanceType extends Handlebars {}
// module.exports = hbs;