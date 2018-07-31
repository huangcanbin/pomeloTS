import consts = require('../util/consts');
import mongoClient = require('mongodb');
import { BaseDao } from './BaseDao';

export class HeroLogDao extends BaseDao
{
    public static instance: HeroLogDao;
    public static getInstance(): HeroLogDao
    {
        if (!this.instance)
        {
            this.instance = new HeroLogDao();
        }
        return this.instance
    }

    public constructor()
    {
        super();
    }

    public createMany(heros: any, areaId: number, callback: Function, context: Object): void
    {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect)
        {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("HeroLog", (err: any, col: mongoClient.Collection, close: Function) =>
        {
            if (!!err)
            {
                close();
                callback.call(context, err);
                return;
            }
            col.insertMany(heros, (err: any) => 
            {
                if (!!err)
                {
                    close();
                    callback.call(context, err);
                    return;
                }
                close();
                callback.call(context, null);
            });
        });
    }
}