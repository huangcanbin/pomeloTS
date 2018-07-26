 var consts = require('../../util/consts');
var util = require('util');
/**
 * 玩家离线收益记录
 * 
 * @param {*} opts 
 */
var OffEarRec = function (opts) {
    opts = opts || {};  
    this.exp = opts.exp || 0;               //经验    
    this.gold = opts.gold || 0;             //金币    
    this.items = opts.items || 0;           //物品列表 [{id: 40000, num: 1}]   
    this.isTimes = opts.isTimes || true;    //收益已翻倍
};

module.exports = OffEarRec;

//extend methods.
