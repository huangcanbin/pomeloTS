Object.defineProperty(exports, "__esModule", { value: true });
class Response {
    constructor(opts) {
        this._opts = {};
        this._opts.time = Date.now();
        this._opts = opts;
    }
    execute(callback, context) {
        this._callback = callback;
        this._context = context;
        this._callback.call(this._context, this._opts);
    }
}
exports.Response = Response;
