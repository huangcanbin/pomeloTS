const arrayUtil = require("../util/arrayUtil");

/**
 * @param {Array} items  add item object, ex: [{id:1, type:1, num:1}]
 * @param {Map} configItem items config
 */
var ItemBuilder = function (items, configItem) {
    this.map = {};
    items = items || [];
    var item, temp, config;
    for (var i = 0; i < items.length; i++) {
        temp = items[i];
        config = configItem.get(temp.id);
        if (!config && temp.type != 1 && temp.type != 2 && temp.type != 3 && temp.type != 9) continue;

        item = {
            id: temp.id,
            type: temp.type,
            num: temp.num || 0,
            max: config ? (config.max || 1) : 1,
            itemType: config ? config.type : 0, //物品的类型 0：道具物品 1：材料物品            
        }
        var val = this.map[item.type];
        if (!val) this.map[item.type] = [];
        this.map[item.type].push(item);
    }
};

module.exports = ItemBuilder;

/**
 * gold
 */
ItemBuilder.prototype.getGold = function () {
    let gold = (this.map[1] || []).sum((t) => {
        return t.num;
    });

    return gold;
};

/**
 * exp
 */
ItemBuilder.prototype.getExp = function () {
    let exp = (this.map[2] || []).sum((t) => {
        return t.num;
    });

    return exp;
};

/**
 * money
 */
ItemBuilder.prototype.getMoney = function () {
    let money = (this.map[3] || []).sum((t) => {
        return t.num;
    });

    return money;
};

/**
 * lifelike
 */
ItemBuilder.prototype.getLifeLike = function () {
    let lifelike = (this.map[9] || []).sum((t) => {
        return t.num;
    });

    return lifelike;
};

/**
 * items array
 */
ItemBuilder.prototype.getItem = function () {
    //return this.map[4] || [];
    var items = [];
    for (var pair in this.map) {
        pair = (1 * pair);
        if (pair > 3 && pair != 9) {
            items = items.concat(this.map[pair]);
        }
    }
    return items;
};

/**
 * heros
 */
// ItemBuilder.prototype.getHero = function () {
//     //todo: item type of hero
//     return this.map[5] || [];
// };