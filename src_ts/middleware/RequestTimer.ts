"use strict";

import {loggerInstance as logger} from '../logger/Logger';

class RequestTimer {

  register() {
    return function *RequestTimer(next: any){
      var start: any = new Date;
      yield next;
      var consumed = <any>new Date - start;
      if (process.env.hasOwnProperty('DEBUG')) {
        this.set('X-Response-Time', consumed + 'ms');
      }
      logger.info(this.reqId, '%s %s - %s ms', this.method, this.url, consumed);
    }
  }

}

const timer = new RequestTimer();

module.exports = timer;