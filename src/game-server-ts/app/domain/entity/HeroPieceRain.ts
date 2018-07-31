import { MySelf } from "./MySelf";

/**
 * 式神雨实体数据模型
 * @author Andrew_Huang
 * @export
 * @class HeroPieceRain
 * @extends {MySelf}
 */
export class HeroPieceRain extends MySelf
{
    private _status: number;    //任务状态 0代表可领奖，1代表第一次签到已领取
    private _num: number;       //N级式神品质碎片的数量
    private _rnum: number;      //R级式神品质碎片的数量
    private _srnum: number;     //SR级式神品质碎片的数量
    private _ssrnum: number;    //SSR级式神品质碎片的数量
    private _rssrnum: number;   //真SSR级式神品质碎片的数量

    public constructor(opts: any)
    {
        super(opts);
        this._status = opts.status || 0;
        this._num = opts.num;
        this._rnum = opts.rnum;
        this._srnum = opts.srnum;
        this._ssrnum = opts.ssrnum;
        this._rssrnum = opts.rssrnum;
    }

    public get status(): number
    {
        return this._status;
    }

    public get num(): number
    {
        return this._num;
    }

    public get rnum(): number
    {
        return this._rnum;
    }

    public get srnum(): number
    {
        return this._srnum;
    }

    public get ssrnum(): number
    {
        return this._ssrnum;
    }

    public get rssrnum(): number
    {
        return this._rssrnum;
    }
}