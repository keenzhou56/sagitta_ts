"use strict";

import * as libFsp from 'fs-promise';
import * as libPath from 'path';

import * as joi from 'joi';
const joiValidate = require('./utility/JoiValidate');
const debug       = require('debug')('sagitta');

import {Cache, cacheInstance} from './cache/Cache';
import {Config, configInstance} from './config/Config';
import {Logger,loggerInstance} from './logger/Logger';
import {OrmHandler, ormInstance} from './orm/OrmHandler';
import {RouterLoader as Router, routerInstance} from './router/Router';
import {Handlebars as Template, templateInstance} from './template/Handlebars';

import * as koa from "koa";
const koaServe        = require('koa-static');
const koaBodyParser   = require('koa-bodyparser');
const koaQueryString  = require('koa-qs');
const koaCors         = require('koa-cors');

const koaMidNotFoundHandler   = require('./middleware/NotFoundHandler');
const koaMidRequestIdHandler  = require('./middleware/RequestIdHandler');
const koaMidRequestTimer      = require('./middleware/RequestTimer');
const koaMidErrorHandler      = require('./middleware/ErrorHandler');
const koaVhostHandler         = require('./middleware/VhostHandler');
const koaCompressHandler      = require('./middleware/CompressHandler');
const koaJWTHandler           = require('./middleware/JWTHandler');

class App {

  constructor(
      public cache:    Cache,
      public config:   Config,
      public logger:   Logger,
      public orm:      OrmHandler,
      public router:   Router,
      public template: Template,
      public app:      koa,
      public conf:     {[key:string]: any},
      public initialized: boolean
  ) {
  }

  init(conf: any) {
    debug('[Sagitta] Start to initialize app ...');

    this.conf = conf;

    // schema definition
    let confSchema: any = joi.object().keys({
      cache:    this.cache.schema,
      config:   this.config.schema,
      logger:   this.logger.schema,
      orm:      this.orm.schema,
      router:   this.router.schema,
      template: this.template.schema,
      app:      joi.object().keys({
        hostname:     joi.string().optional(),
        host:         joi.string().ip().optional(),
        port:         joi.number().integer().min(1).max(65535).optional().default(3000),
        staticPath:   joi.string().required(),
        errorHandle:  joi.func().default(koaMidErrorHandler.register()),
        formLimit:    joi.number().integer().min(1).max(65535).optional().default(4096),
        maxAge:       joi.number().integer().default(0),
        enableJWT:    joi.boolean().optional(),
        enableCors:   joi.boolean().optional(),
        enableVhost:  joi.boolean().optional(),
        enableRender: joi.boolean().optional(),
        jwtSecret:    joi.string().optional(),
        jwtPaths:     joi.array().optional(),
        compressOpt:  joi.object().optional()
      }).required()
    });

    // initialization
    return new Promise((resolve, reject) => {
      joiValidate(conf, confSchema).then((_: any) => {
        let initQueue: any[] = [
          this.cache.initialize(conf.cache),
          this.config.initialize(conf.config),
          this.logger.initialize(conf.logger),
          this.orm.initialize(conf.orm),
          this.router.initialize(conf.router),
          this.template.initialize(conf.template)
        ];
        return Promise.all(initQueue);
      }).then((_: any) => {
        return this.initialize();
      }).then((_: any) => {
        this.initialized = true;
        debug('[Sagitta] Initialization done!');
        resolve(_);
      }).catch((err: any) => {
        debug('[Sagitta] Initialization failed: %j', err);
        reject(err);
      });
    });
  }

  initialize() {
    return new Promise((resolve, reject) => {
      const _this = this;
      const _app  = _this.app;
      const _conf = _this.conf;

      libFsp.stat(_conf.app.staticPath)
        .then((stats: any) => {

          // validate path is exist
          if (!stats.isDirectory()) {
            throw new Error('[App] conf.app.staticPath have to be a valid path!');
          } else if (!libPath.isAbsolute(_conf.app.staticPath)) {
            throw new Error('[App] conf.app.staticPath have to be an absolute path!');
          }

          // add query string parser
          koaQueryString(_app, 'extended');

          // enable Access-Control-Allow-Origin
          let enableCors = _conf.app.enableCors || false;
          if (enableCors === true) {
            _app.use(koaCors({ origin: '*' }));
          }

          // enable Gzip
          let enableGzip = _conf.app.enableGzip || true;
          if (enableGzip === true) {
            _app.use(koaCompressHandler.register(_conf.app.compressOpt));
          }

          _app.use(_conf.app.errorHandle);                 // error handle
          _app.use(koaServe(_conf.app.staticPath, {maxAge: _conf.app.maxAge || 0}));        // static files serving
          _app.use(koaMidRequestIdHandler.register());     // add request id in app
          _app.use(koaMidRequestTimer.register());         // request timer
          _app.use(koaBodyParser({ formLimit: _conf.app.formLimit + 'kb'}));  // post body parser

          // add jwt if open jwt auth
          let enableJWT = _conf.app.enableJWT || false;
          if (enableJWT === true) {
            _app.use(
              koaJWTHandler.register({ secret: _conf.app.jwtSecret }, _conf.app.jwtPaths).unless(routerInstance.getJwtUnless())
            );
          }

          // config router
          _app.use(this.router.instance.routes());

          // render router
          let enableRender = _conf.app.enableRender || false;
          if (enableRender === true) {
            // server in production with server render.
            _app.use(function *(next: any) {
              let distServer = require(libPath.join(_conf.app.staticPath, 'server.js')).default;
              const res = yield distServer(this, _conf.app.staticPath);
              if (res.status == 302) {
                this.status = res.status;
                this.redirect(res.redirectPath);
              } else if (res.status == 200) {
                this.body   = res.body
              } else {
                this.body   = res.body;
                this.status = res.status;
              }
            });
          }

          // default router
          _app.use(function *(next: any) {
            if (this.path.match('/api/')) {
              yield next;
            } else {
              this.body = libFsp.readFileSync(_conf.app.staticPath + "/index.tpl", {'encoding': 'utf8'});
            }
          });

          // 404 handler
          _app.use(koaMidNotFoundHandler.register());
          _app.on('error', function(err: any) {
            loggerInstance.error('Server error: %s', err);
          });

          // enableVhost
          let enableVhost = _conf.app.enableVhost || false;
          if (enableVhost === true) {
            _app.use(koaVhostHandler.register([{ host: _conf.app.hostname, app: _app }]));
          }

          resolve();
        })
        .catch((err: any) => reject(err));
    });
  }

  start() {
    const _this = this;
    const _app  = _this.app;
    const _conf = _this.conf;

    if (!_this.initialized) {
      debug('[Sagitta] Initialization not done yet!');
      return;
    }

    if (_conf.app.hasOwnProperty('host')) {
      _app.listen(_conf.app.port, _conf.app.host);
      debug(`[Sagitta] App listening on: ${_conf.app.host}:${_conf.app.port}`);
    } else {
      _app.listen(_conf.app.port);
      debug(`[Sagitta] App listening on: ${_conf.app.port}`);
    }
  }

}

module.exports = new App(cacheInstance, configInstance, loggerInstance, ormInstance, routerInstance, templateInstance, new koa(), {}, false);