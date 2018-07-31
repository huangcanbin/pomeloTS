import daily = require('./Daily');
import offEarRec = require('./OffEarRec');
import goblin = require('./Goblin');
import consts = require('../../util/consts');
import { Entity } from './Entity';

/**
 * 
 * @author Andrew_Huang
 * @export
 * @class Player
 * @extends {Entity}
 */
export class Player extends Entity
{
    private _playerId: number;          //玩家全区唯一编号
    private _roleId: number;            //主角配置表的编号
    private _name: string;              //昵称
    private _uid: string;               //账号ID,账号唯一编号
    private _maxPos: number;            //式神战位
    private _lv: number;                //等级
    private _exp: number;               //经验
    private _gold: number;              //金币
    private _money: number;             //代币
    private _power: number;             //战斗力
    private _energy: number;            //体力
    private _bean: number;              //仙豆
    private _maxStage: number;          //最大关卡ID
    private _nowStage: number;          //当前关卡ID
    private _expRise: number;           //经验增长率
    private _goldRise: number;          //金币增长率
    private _firstLogin: number;        //首次登录的时间
    private _lastLogin: number;         //最新登录的时间
    private _lastLogout: number;        //最后退出的时间
    private _lastStage: number;         //最大关卡完成时间
    private _lastEnergy: number;        //体力最后恢复时间
    private _lastBean: number;          //仙豆最后恢复时间
    private _daily: daily.Daily;        //玩家日常
    private _goblin: goblin.Goblin;     //百鬼类型
    private _heroBagNum: number;        //式神背包格子数量
    private _heroBagExt: number;        //式神背包扩充次数
    private _heroFragment: number;      //式神碎片
    private _maxHeroLineup: number;     //式神最大阵位编号,默认开启5个
    private _propBagNum: number;        //道具背包格子数
    private _propBagExt: number;        //道具背包已经扩充次数
    private _matBagNum: number;         //材料背包格子数
    private _matBagExt: number;         //材料背包已经扩充次数
    private _idNumber: string;          //身份证号码
    private _isAdult: boolean;          //是否成年
    private _lucreTime: number;         //今日收益时间,防沉迷系统使用
    private _lucreUpTime: number;       //上次收益更新时间,防沉迷系统使用
    private _OffEarRec: offEarRec.OffEarRec;//离线收益记录
    private _heroNum: number;           //式神数量
    private _goblinFlag: number;        //完成一次百度标记
    private _lastHeroPieceRain: number; //最后一次完成式神碎片雨时间
    private _heroPieceRainNum: number;  //完成式神碎片活动次数
    private _hasNewMail: number;        //有没有新邮件
    private _vip: number;               //VIP等级
    private _lastVipAwardTime: number;  //最近一次领每日vip奖励的时间
    private _firstDayOnLineTime: number;//最近一次领每日vip奖励的时间
    private _lifeLike: number;          //命格值
    private _lifeLikeLevel: number;     //命格等级
    private _isRemedial: boolean;       //是否补领过前日日常任务奖励
    private _remedialList: any;         //待补领奖励id列表
    private _onlineTime: number;        //当日在线时长
    private _rankedCard: number;        //排位赛剩余挑战令
    private _rankedHistory: any;        //排位赛挑战历史
    private _lastFullCard: number;      //排位赛上一次满5张挑战令的时间
    private _nextFullCard: number;      //排位赛上一次满5张挑战令的时间
    private _lastRanked: number;        //上一次进入排位赛界面并进行redis更新的时间

    public constructor(opts: any)
    {
        super(opts);
        this._playerId = opts.playerId;
        this._name = opts.name;
        this._roleId = opts.roleId;
        this._uid = opts.uid;
        this._maxPos = opts.maxPos;
        this._lv = opts.lv || 1;
        this._exp = opts.exp || 0;
        this._gold = opts.gold || 0;
        this._money = opts.money || 0;
        this._power = opts.power || 0;
        this._energy = opts.energy || 0;
        this._bean = opts.bean || 0;
        this._maxStage = opts.maxStage || 0;
        this._nowStage = opts.nowStage || 0;
        this._expRise = opts.expRise;
        this._goldRise = opts.goldRise;
        this._firstLogin = opts.firstLogin;
        this._lastLogin = opts.lastLogin;
        this._lastLogout = opts.lastLogout;
        this._lastStage = opts.lastStage || 0;
        this._lastEnergy = opts.lastEnergy || 0;
        this._lastBean = opts.lastBean || 0;
        this._daily = new daily.Daily();
        this._goblin = opts.goblin || new goblin.Goblin();
        this._heroBagNum = opts.heroBagNum || 0;
        this._heroBagExt = opts.heroBagExt || 0;
        this._heroFragment = opts.heroFragment || 0;
        this._maxHeroLineup = opts.maxHeroLineup;
        this._propBagNum = opts.propBagNum || 30;
        this._propBagExt = opts.propBagExt || 0;
        this._matBagNum = opts.matBagNum || 30;
        this._matBagExt = opts.matBagExt || 0;
        this._idNumber = opts.idNumber;
        this._isAdult = opts.isAdult || false;
        this._lucreTime = opts.lucreTime || 0;
        this._lucreUpTime = opts.lucreUpTime || 0;
        this._OffEarRec = opts.offEarRec || new offEarRec.OffEarRec();
        this._heroNum = opts.heroNum || 1;
        this._goblinFlag = opts.goblinFlag || 0;
        this._lastHeroPieceRain = opts.lastHeroPieceRain || 0;
        this._heroPieceRainNum = opts.heroPieceRainNum || 0;
        this._hasNewMail = opts.hasNewMail || 0;
        this._vip = opts.vip || 0;
        this._lastVipAwardTime = opts.lastVipAwardTime || 0;
        this._firstDayOnLineTime = opts.firstDayOnLineTime || 0;
        this._lifeLike = opts.lifeLike || 0;
        this._lifeLikeLevel = opts.lifeLikeLevel || 1;
        this._isRemedial = opts.isRemedial || false;
        this._remedialList = opts.remedialList || [];
        this._onlineTime = opts.onlineTime || 0;
        this._rankedCard = opts.rankedCard || consts.default.consts.Enums.RankedCard;
        this._rankedHistory = opts.rankedHistory || [];
        this._lastFullCard = opts.lastFullCard || 0;
        this._nextFullCard = opts.nextFullCard || 0;
        this._lastRanked = opts.lastFullCard || 0;
    }

    public get playerId(): number
    {
        return this._playerId;
    }

    public get roleId(): number
    {
        return this._roleId;
    }

    public get name(): string
    {
        return this._name;
    }

    public get uid(): string
    {
        return this._uid;
    }

    public get maxPos(): number
    {
        return this._maxPos;
    }

    public get lv(): number
    {
        return this._lv;
    }

    public get exp(): number
    {
        return this._exp;
    }

    public get gold(): number
    {
        return this._gold;
    }

    public get money(): number
    {
        return this._money;
    }

    public get power(): number
    {
        return this._power;
    }

    public get energy(): number
    {
        return this._energy;
    }

    public get bean(): number
    {
        return this._bean;
    }

    public get maxStage(): number
    {
        return this._maxStage;
    }

    public get nowStage(): number
    {
        return this._nowStage;
    }

    public get expRise(): number
    {
        return this._expRise;
    }

    public get goldRise(): number
    {
        return this._goldRise;
    }

    public get firstLogin(): number
    {
        return this._firstLogin;
    }

    public get lastLogin(): number
    {
        return this._lastLogin;
    }

    public get lastLogout(): number
    {
        return this._lastLogout;
    }

    public get lastStage(): number
    {
        return this._lastStage;
    }

    public get lastEnergy(): number
    {
        return this._lastEnergy;
    }

    public get lastBean(): number
    {
        return this._lastBean;
    }

    public get daily(): daily.Daily
    {
        return this._daily;
    }

    public get goblin(): goblin.Goblin
    {
        return this._goblin;
    }

    public get heroBagNum(): number
    {
        return this._heroBagNum;
    }

    public get heroBagExt(): number
    {
        return this._heroBagExt
    }

    public get heroFragment(): number
    {
        return this._heroFragment
    }

    public get maxHeroLineup(): number
    {
        return this._maxHeroLineup
    }

    public get propBagNum(): number
    {
        return this._propBagNum;
    }

    public get propBagExt(): number
    {
        return this._propBagExt;
    }

    public get matBagNum(): number
    {
        return this._matBagNum;
    }

    public get matBagExt(): number
    {
        return this._matBagExt;
    }

    public get idNumber(): string
    {
        return this._idNumber;
    }

    public get isAdult(): boolean
    {
        return this._isAdult;
    }

    public get lucreTime(): number
    {
        return this._lucreTime;
    }

    public get lucreUpTime(): number
    {
        return this._lucreUpTime;
    }

    public get OffEarRec(): offEarRec.OffEarRec
    {
        return this._OffEarRec;
    }

    public get heroNum(): number
    {
        return this._heroNum;
    }

    public get goblinFlag(): number
    {
        return this._goblinFlag;
    }

    public get lastHeroPieceRain(): number
    {
        return this._lastHeroPieceRain;
    }

    public get heroPieceRainNum(): number
    {
        return this._heroPieceRainNum;
    }

    public get hasNewMail(): number
    {
        return this._hasNewMail;
    }

    public get vip(): number
    {
        return this._vip;
    }

    public get lastVipAwardTime(): number
    {
        return this._lastVipAwardTime;
    }

    public get firstDayOnLineTime(): number
    {
        return this._firstDayOnLineTime;
    }

    public get lifeLike(): number
    {
        return this._lifeLike;
    }

    public get lifeLikeLevel(): number
    {
        return this._lifeLikeLevel;
    }

    public get isRemedial(): boolean
    {
        return this._isRemedial;
    }

    public get remedialList(): any
    {
        return this._remedialList;
    }

    public get onlineTime(): number
    {
        return this._onlineTime;
    }

    public get rankedCard(): number
    {
        return this._rankedCard;
    }

    public get rankedHistory(): any
    {
        return this._rankedHistory;
    }

    public get lastFullCard(): number
    {
        return this._lastFullCard;
    }

    public get nextFullCard(): number
    {
        return this._nextFullCard;
    }

    public get lastRanked(): number
    {
        return this._lastRanked;
    }
}