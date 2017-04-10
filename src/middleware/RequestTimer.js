"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = require("../logger/Logger");
class RequestTimer {
    register() {
        return function* RequestTimer(next) {
            var start = new Date;
            yield next;
            var consumed = new Date - start;
            if (process.env.hasOwnProperty('DEBUG')) {
                this.set('X-Response-Time', consumed + 'ms');
            }
            Logger_1.loggerInstance.info(this.reqId, '%s %s - %s ms', this.method, this.url, consumed);
        };
    }
}
const timer = new RequestTimer();
module.exports = timer;
//# sourceMappingURL=RequestTimer.js.map