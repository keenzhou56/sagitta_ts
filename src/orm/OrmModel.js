"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const OrmHandler_1 = require("./OrmHandler");
const Cache_1 = require("../cache/Cache");
const Logger_1 = require("../logger/Logger");
class OrmModel {
    constructor() {
        this.name = ''; // model name
        this.cacheKey = ''; // model identity attribute name
        this.schema = {}; // waterline model definition schema object
    }
    get instance() {
        return OrmHandler_1.ormInstance.getWaterlineModel(this.name);
    }
    register() {
        this.checkAfterChangeEventDefinition('afterCreate');
        this.checkAfterChangeEventDefinition('afterUpdate');
        this.checkAfterChangeEventDefinition('afterDestroy');
        return this.schema;
    }
    find(identity, query) {
        let cacheHit = false;
        let queryString = JSON.stringify(query);
        return new Promise((resolve, reject) => {
            Cache_1.cacheInstance.getModelHash(this.name, identity, queryString).then((data) => {
                if (data) {
                    cacheHit = true;
                    return Promise.resolve(data);
                }
                else {
                    return this.instance.find(query);
                }
            }).then((data) => {
                if (data && !cacheHit) {
                    return Cache_1.cacheInstance.setModelHash(this.name, identity, queryString, data);
                }
                else {
                    return Promise.resolve(data);
                }
            }).then((data) => {
                resolve(data);
            }).catch((err) => {
                reject(err);
            });
        });
    }
    getCacheKeyVal(values) {
        if (Array.isArray(values)) {
            return values[0][this.cacheKey];
        }
        else {
            return values[this.cacheKey];
        }
    }
    static getValByKey(key, values) {
        if (Array.isArray(values)) {
            return values[0][key];
        }
        else {
            return values[key];
        }
    }
    checkAfterChangeEventDefinition(eventName) {
        if (!this.schema.hasOwnProperty(eventName)) {
            let me = this;
            this.schema[eventName] = me[eventName];
        }
    }
    static removeCacheAfterRecordChanged(name, cacheKey, data, next) {
        Cache_1.cacheInstance.removeModelHash(name, OrmModel.getValByKey(cacheKey, data))
            .then((_) => next())
            .catch((err) => {
            Logger_1.loggerInstance.error(err);
            next();
        });
    }
}
module.exports = OrmModel;
//# sourceMappingURL=OrmModel.js.map