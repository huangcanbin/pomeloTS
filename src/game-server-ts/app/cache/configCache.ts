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
export class ConfigCache
{
    public static instance: ConfigCache;
    public static getInstance(): ConfigCache
    {
        if (!this.instance)
        {
            this.instance = new ConfigCache();
        }
        return this.instance;
    }

    public constructor()
    {

    }

    public getVarConst(id: string, num: number = 0): number
    {
        console.log(id);
        console.log(num);
        return 0;
    }

    public getCharacter(id: number, lv: number = null): any
    {
        console.log(id);
        console.log(lv);
        return 0;
    }

    public getHero(id: number, lv: number = null): any
    {
        console.log(id);
        console.log(lv);
        return null;
    }

    public getSkill(id: number, lv: number = null): any
    {
        console.log(id);
        console.log(lv);
        return null;
    }

    public getIllustrated(id: number, lv: number = null): any
    {
        console.log(id);
        console.log(lv);
        return null;
    }

    public getIllAch(id: number, lv: number = null): any
    {
        console.log(id);
        console.log(lv);
        return null;
    }

    public getMonster(id: number, lv: number = null): any
    {
        console.log(id);
        console.log(lv);
        return null;
    }
}