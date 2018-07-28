// import dbLoader = require('./DbLoader');
// import utils = require('../util/utils');
// // import async = require('async');
// import logger = require('pomelo-logger');//.getLogger(__filename);
// import consts = require('../util/consts');
// import arrayUtil = require('../util/arrayUtil');
// import ConfigFormat = require('./configFormat');

/**
 * 配置数据缓存库
 * @author Andrew_Huang
 * @export
 * @class ConfigCache
 */
export default class ConfigCache
{
    public constructor()
    {

    }

    public static getVarConst(id: string, num: number = 0): number
    {
        console.log(id);
        console.log(num);
        return 0;
    }

    public static getCharacter(id: number, lv: number = null): any
    {
        console.log(id);
        console.log(lv);
        return 0;
    }

    public static getHero(id: number, lv: number = null): any
    {
        console.log(id);
        console.log(lv);
        return null;
    }

    public static getSkill(id: number, lv: number = null): any
    {
        console.log(id);
        console.log(lv);
        return null;
    }

    public static getIllustrated(id: number, lv: number = null): any
    {
        console.log(id);
        console.log(lv);
        return null;
    }

    public static getIllAch(id: number, lv: number = null): any
    {
        console.log(id);
        console.log(lv);
        return null;
    }
}