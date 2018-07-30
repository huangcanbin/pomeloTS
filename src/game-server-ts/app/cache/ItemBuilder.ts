

export class ItemBuilder
{
    private _map: any;

    public constructor(items: any, configItem: any)
    {
        this._map = {};
        items = items || [];
        let item, temp, config;
        for (var i: number = 0; i < items.length; i++)
        {
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
            let val = this._map[item.type];
            if (!val) this._map[item.type] = [];
            this._map[item.type].push(item);
        }
    }

    public getGold(): number
    {
        let gold: number = (this._map[1] || []).sum((t: any) =>
        {
            return t.num;
        });
        return gold;
    }

    public getExp(): number
    {
        let exp: number = (this._map[2] || []).sum((t: any) =>
        {
            return t.num;
        });
        return exp;
    }

    public getMoney(): number
    {
        let money: number = (this._map[3] || []).sum((t: any) =>
        {
            return t.num;
        });
        return money;
    }

    public getLifeLike(): any
    {
        let items: any = [];
        for (let pair in this._map)
        {
            let p = parseInt(pair)
            if (p > 3 && p != 9)
            {
                items = items.concat(this._map[p]);
            }
        }
        return items;
    }
}