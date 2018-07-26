const consts = require('../../util/consts');
/**
 * 推送到sd消费接口的实体数据 
 */
class PushConsumeModel {
    constructor(opts) {
        opts = opts || {};
        this.ServerID = opts.serverID || 0;     //areaId
        this.Type = opts.type || consts.Enums.consumeType.buyItem;             //消费类型,枚举:consts.Enums.consumeType
        this.AccountID = opts.accountID || 0;    //palyerId
        this.UserID = opts.accountID || 0;          //palyerId
        this.Number = opts.number || 0;          //消费点数 正数:玩家消费 负数:玩家获得奖励
        this.ItemType = opts.itemType || 0;      //道具ID, 功能消费可以填type
        this.Price = opts.price || 0;            //道具单价
        this.ItemCnt = opts.itemCnt || 1;        //道具数量
        this.MoneyType = opts.moneyType || consts.Enums.consumeMoneyType.money;    //货币类型,枚举:consts.Enums.consumeMoneyType
    }
}

module.exports = PushConsumeModel;