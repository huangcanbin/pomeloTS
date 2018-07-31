
/**
 * 响应实体对象
 * @author Andrew_Huang
 * @export
 * @class Response
 */
export class Response
{
    private _callback: Function;
    private _context: Object;
    private _opts: any;

    public constructor(opts: any)
    {
        this._opts = {};
        this._opts.time = Date.now();
        this._opts = opts;
    }

    public execute(callback: Function, context: Object): void
    {
        this._callback = callback;
        this._context = context;
        this._callback.call(this._context, this._opts);
    }
}