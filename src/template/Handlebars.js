"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const libPath = require('path');
const handlebars = require('handlebars');
const joi = require('joi');
const joiValidate = require('../utility/JoiValidate');
class Handlebars {
    constructor() {
        this.cache = {};
        this.schema = joi.object().keys({}).optional();
    }
    initialize(conf) {
        return Promise.resolve();
    }
    render(fileName, args) {
    }
}
exports.templateInstance = new Handlebars();
// module.exports = hbs; 
//# sourceMappingURL=Handlebars.js.map