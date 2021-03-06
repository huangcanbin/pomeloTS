import is = require('is');

/**
 * 数组工具
 * @author Andrew_Huang
 * @export
 * @class ArrayUtil
 */
export class ArrayUtil
{
    public constructor()
    {

    }

    public static instance: ArrayUtil;
    public static getInstance(): ArrayUtil
    {
        if (!this.instance)
        {
            this.instance = new ArrayUtil();
        }
        return this.instance;
    }

    public where<T>(arr: T[], obj: any): T[]
    {
        let keys = Object.keys(obj);
        let ret = [];
        for (let i: number = 0; i < arr.length; i++)
        {
            let item: any = arr[i];
            let find = keys.every((t) =>
            {
                return item[t] == obj[t];
            });
            if (find)
            {
                ret.push(item);
            }
        }
        return ret;
    }

    public firstOrDefault<T>(arr: T[], obj: any = null): T
    {
        if (obj)
        {
            let items = this.where(arr, obj);
            if (items.length > 0)
            {
                return items[0];
            }
            return null;
        } else
        {
            return arr[0];
        }
    }

    public select<T>(arr: T[], selector: ((item: any) => boolean)): T[]
    {
        let ret = [];
        let fun: Function = <Function>selector;
        for (let i: number = arr.length - 1; i >= 0; i--)
        {
            if (fun(arr[i]))
            {
                ret.push(arr[i]);
            }
        }
        return ret;
    }

    public joinArray<T>(arr: T[], joinArr: any, selector: (item: any) => any): T[]
    {
        let result = [];
        for (let i = 0; i < arr.length; i++)
        {
            let item = arr[i];
            let arrItem = joinArr[i];
            let newObj = Object.assign(item, selector(arrItem));
            result.push(newObj);
        }
        return result;
    }

    public sum<T>(arr: T[], selector: (item: any) => number): number
    {
        let result = 0;
        for (let i: number = 0; i < arr.length; i++)
        {
            result += selector(arr[i]);
        }

        return result;
    }

    public pushArray<T>(orgArr: T[], arr: T[], predicate?: (item: any) => boolean): T[]
    {
        if (!arr || arr.length <= 0)
        {
            return orgArr;
        }
        for (let i = 0; i < arr.length; i++)
        {
            let item = arr[i];
            if (!!predicate && predicate(item))
            {
                orgArr.push(item);
            }
            else
            {
                orgArr.push(item);
            }
        }
        return orgArr;
    }

    public dictionaryFirstOrDefault(dic: any, predicate: (item: any) => boolean): any
    {
        if (!is.function(predicate))
        {
            return null;
        }
        for (let i in dic)
        {
            let item = dic[i];
            if (predicate(item))
            {
                return item;
            }
        }
        return null;
    }

    public dictionaryWhere(dic: any, predicate: (item: any) => boolean): any
    {
        let result = [];
        if (!is.function(predicate))
        {
            return [];
        }
        for (let i in dic)
        {
            let item = dic[i];
            if (predicate(item))
            {
                result.push(item);
            }
        }
        return result;
    }

    public dictionaryToArray(dic: any, predicate?: (item: any) => boolean): any
    {
        let result = [];
        if (!!predicate)
        {
            if (!is.function(predicate))
            {
                return [];
            }
            for (let i in dic)
            {
                let item = dic[i];
                if (predicate(item))
                {
                    result.push(item);
                }
            }
        }
        else
        {
            for (let i in dic)
            {
                let item = dic[i];
                result.push(item);
            }
        }
        return result;
    }
}