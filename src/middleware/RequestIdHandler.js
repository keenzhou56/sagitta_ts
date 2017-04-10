"use strict";
const libCrypto = require('crypto');
class RequestIdHandler {
    /**
     * Provide a koa middleware register function
     */
    register() {
        return function* requestIdRegister(next) {
            this.reqId = libCrypto.randomBytes(12);
            yield next;
        };
    }
}
const requestIdHandler = new RequestIdHandler();
module.exports = requestIdHandler;
//# sourceMappingURL=RequestIdHandler.js.map