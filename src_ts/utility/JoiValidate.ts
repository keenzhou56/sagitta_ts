"use strict";

import * as joi from 'joi';
import * as bluebird from 'bluebird';


export = bluebird.promisify(joi.validate);
