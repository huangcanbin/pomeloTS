import { MySelf } from "./MySelf";

/**
 * 玩家镇妖塔记录实体数据模型
 * @author Andrew_Huang
 * @export
 * @class Tower
 * @extends {MySelf}
 */
export class Tower extends MySelf
{
    private _nowId: number;     //当前挑战的塔层编号
    private _highestId: number; //挑战过最高的塔层编号
    private _resetNum: number;  //今日重置次数
    private _resetTime: number; //最后重置时间
    private _isSweep: number;   //是否可以扫荡

    public constructor(opts?: any)
    {
        if (!opts)
        {
            opts = {};
        }
        super(opts);
        this._nowId = opts.nowId || 1;
        this._highestId = opts.highestId || 1;
        this._resetNum = opts.resetNum || 0;
        this._resetTime = opts.resetTime || 0;
        this._isSweep = opts.isSweep || false;
    }

    public get nowId(): number
    {
        return this._nowId;
    }

    public get highestId(): number
    {
        return this._highestId;
    }

    public get resetNum(): number
    {
        return this._resetNum;
    }

    public get resetTime(): number
    {
        return this._resetTime;
    }

    public get isSweep(): number
    {
        return this._isSweep;
    }
}