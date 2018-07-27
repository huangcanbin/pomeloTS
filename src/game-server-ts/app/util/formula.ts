// import formula = module.exports;
// import consts = require('./consts');
// import ConfigCache = require('../cache/configCache');
// import logger = require('pomelo-logger');//
// import system = require("system")
// import Utils = require('./utils');
// import arrayUtil = require('./arrayUtil');

/**
 * 格式化工具
 * @author Andrew_Huang
 * @export
 * @class Formula
 */
export default class Formula
{
    public static PdMaxLucreTime: number = 1000 * 60 * 10; //每天最大收益时间10分钟

    public constructor()
    {
        // logger.getLogger(system.__filename);
    }

    // /**
    //  * 获取最大收益时间
    //  * @author Andrew_Huang
    //  * @static
    //  * @param {*} player     玩家数据
    //  * @param {number} now   当前时间戳
    //  * @param {Function} [callback=null]
    //  * @param {Object} [context=null]
    //  * @returns {*}
    //  * @memberof Formula
    //  */
    // public static getMaxLucreTime(player: any, now: number, callback: Function = null, context: Object = null): any
    // {
    //     //是否今天收益过
    //     let isToday: boolean = true;
    //     let maxLucreTime: number = Formula.PdMaxLucreTime;
    //     //判断创建账号是否超过3 0天,判断是否成年
    //     let ctime: number = Utils.default.getZeroHour(player.createTime) + (31 * 24 * 1000 * 60 * 60);

    //     // if (!player.isAdult && now >= ctime)
    //     // {
    //     //     //今天是否计算过收益
    //     //     if (utils.isSameDate(player.lucreUpTime, now))
    //     //     {
    //     //         maxLucreTime = maxLucreTime - player.lucreTime; //最大收益时间-今日收益时间
    //     //         maxLucreTime = maxLucreTime > 0 ? maxLucreTime : 0;
    //     //         today = true;
    //     //     }
    //     //     else
    //     //     {
    //     //         today = false;
    //     //     }
    //     // }
    //     // else
    //     // {
    //     //     //没有防沉迷限制
    //     //     maxLucreTime = -1;
    //     // }

    //     // if (cb && typeof cb === 'function')
    //     // {
    //     //     cb(maxLucreTime);
    //     // } else
    //     // {
    //     //     return { maxLucreTime: maxLucreTime };
    //     // }
    // }
}

