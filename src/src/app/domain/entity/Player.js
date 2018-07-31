Object.defineProperty(exports, "__esModule", { value: true });
const daily = require("./Daily");
const offEarRec = require("./OffEarRec");
const goblin = require("./Goblin");
const consts = require("../../util/consts");
const Entity_1 = require("./Entity");
class Player extends Entity_1.Entity {
    constructor(opts) {
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
    get playerId() {
        return this._playerId;
    }
    get roleId() {
        return this._roleId;
    }
    get name() {
        return this._name;
    }
    get uid() {
        return this._uid;
    }
    get maxPos() {
        return this._maxPos;
    }
    get lv() {
        return this._lv;
    }
    get exp() {
        return this._exp;
    }
    get gold() {
        return this._gold;
    }
    get money() {
        return this._money;
    }
    get power() {
        return this._power;
    }
    get energy() {
        return this._energy;
    }
    get bean() {
        return this._bean;
    }
    get maxStage() {
        return this._maxStage;
    }
    get nowStage() {
        return this._nowStage;
    }
    get expRise() {
        return this._expRise;
    }
    get goldRise() {
        return this._goldRise;
    }
    get firstLogin() {
        return this._firstLogin;
    }
    get lastLogin() {
        return this._lastLogin;
    }
    get lastLogout() {
        return this._lastLogout;
    }
    get lastStage() {
        return this._lastStage;
    }
    get lastEnergy() {
        return this._lastEnergy;
    }
    get lastBean() {
        return this._lastBean;
    }
    get daily() {
        return this._daily;
    }
    get goblin() {
        return this._goblin;
    }
    get heroBagNum() {
        return this._heroBagNum;
    }
    get heroBagExt() {
        return this._heroBagExt;
    }
    get heroFragment() {
        return this._heroFragment;
    }
    get maxHeroLineup() {
        return this._maxHeroLineup;
    }
    get propBagNum() {
        return this._propBagNum;
    }
    get propBagExt() {
        return this._propBagExt;
    }
    get matBagNum() {
        return this._matBagNum;
    }
    get matBagExt() {
        return this._matBagExt;
    }
    get idNumber() {
        return this._idNumber;
    }
    get isAdult() {
        return this._isAdult;
    }
    get lucreTime() {
        return this._lucreTime;
    }
    get lucreUpTime() {
        return this._lucreUpTime;
    }
    get OffEarRec() {
        return this._OffEarRec;
    }
    get heroNum() {
        return this._heroNum;
    }
    get goblinFlag() {
        return this._goblinFlag;
    }
    get lastHeroPieceRain() {
        return this._lastHeroPieceRain;
    }
    get heroPieceRainNum() {
        return this._heroPieceRainNum;
    }
    get hasNewMail() {
        return this._hasNewMail;
    }
    get vip() {
        return this._vip;
    }
    get lastVipAwardTime() {
        return this._lastVipAwardTime;
    }
    get firstDayOnLineTime() {
        return this._firstDayOnLineTime;
    }
    get lifeLike() {
        return this._lifeLike;
    }
    get lifeLikeLevel() {
        return this._lifeLikeLevel;
    }
    get isRemedial() {
        return this._isRemedial;
    }
    get remedialList() {
        return this._remedialList;
    }
    get onlineTime() {
        return this._onlineTime;
    }
    get rankedCard() {
        return this._rankedCard;
    }
    get rankedHistory() {
        return this._rankedHistory;
    }
    get lastFullCard() {
        return this._lastFullCard;
    }
    get nextFullCard() {
        return this._nextFullCard;
    }
    get lastRanked() {
        return this._lastRanked;
    }
}
exports.Player = Player;
