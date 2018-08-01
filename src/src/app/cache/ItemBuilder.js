Object.defineProperty(exports, "__esModule", { value: true });
class ItemBuilder {
    constructor(items, configItem) {
        this._map = {};
        items = items || [];
        let item, temp, config;
        for (let i = 0; i < items.length; i++) {
            temp = items[i];
            config = configItem.get(temp.id);
            if (!config && temp.type != 1 && temp.type != 2 && temp.type != 3 && temp.type != 9)
                continue;
            item = {
                id: temp.id,
                type: temp.type,
                num: temp.num || 0,
                max: config ? (config.max || 1) : 1,
                itemType: config ? config.type : 0,
            };
            let val = this._map[item.type];
            if (!val)
                this._map[item.type] = [];
            this._map[item.type].push(item);
        }
    }
    getGold() {
        let gold = (this._map[1] || []).sum((t) => {
            return t.num;
        });
        return gold;
    }
    getExp() {
        let exp = (this._map[2] || []).sum((t) => {
            return t.num;
        });
        return exp;
    }
    getMoney() {
        let money = (this._map[3] || []).sum((t) => {
            return t.num;
        });
        return money;
    }
    getLifeLike() {
        let items = [];
        for (let pair in this._map) {
            let p = parseInt(pair);
            if (p > 3 && p != 9) {
                items = items.concat(this._map[p]);
            }
        }
        return items;
    }
}
exports.ItemBuilder = ItemBuilder;
