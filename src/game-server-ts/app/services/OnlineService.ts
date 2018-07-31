import pushDataService = require("./PushDataToSdService");

/**
 * 在线服务
 * @author Andrew_Huang
 * @export
 * @class OnlineService
 */
export class OnlineService
{
    public static instance: OnlineService;
    public static getInstance(): OnlineService
    {
        if (!this.instance)
        {
            this.instance = new OnlineService();
        }
        return this.instance;
    }

    private _pushDataToSdService: pushDataService.PushDataToSdService;
    private _userMap: any;

    public constructor()
    {
        this._pushDataToSdService = pushDataService.PushDataToSdService.getInstance();
        this._userMap = new Map();
    }

    public start(areaId: number, areaName: string): void
    {
        //每5分钟向sd平台推送一次在线人数
        setInterval(() =>
        {
            let params = { ServerName: areaName, ServerID: areaId, AccountCnt: this._userMap.size };
            this._pushDataToSdService.pushOnline(params);
        }, 300000);
    }

    public online(userId: string): void
    {
        this._userMap.set(userId, 1);
    }

    public leave(userId: string): void
    {
        this._userMap.delete(userId);
    }
}