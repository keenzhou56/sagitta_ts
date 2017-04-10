'use strict';
const koaCompress = require('koa-compress');
class CompressHandler {
    register(opts) {
        return koaCompress({
            threshold: opts.threshold || '100kb',
            flush: require('zlib').Z_BEST_SPEED
        });
    }
}
const compressHandler = new CompressHandler();
module.exports = compressHandler;
//# sourceMappingURL=CompressHandler.js.map