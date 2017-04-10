"use strict";

const koaVhost  = require('koa-better-vhost');

class VhostHandler {

  register(vhosts: any) {
    return function *VhostHandler (next: any) {
       koaVhost(vhosts);
       yield next;
    };
  }

}

const handler = new VhostHandler ();

module.exports = handler;
