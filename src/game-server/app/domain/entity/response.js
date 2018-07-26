/**
 * Response entity object
 * 
 * @param {object} opts init opts.
 */

module.exports = function (opts, next) {
    return new Response(opts, next);
};

class Response {
    constructor(opts, next) {
        opts.time = Date.now();
        next(null, opts);
    }
}