import pomelo = require('pomelo');

/**
 * 消息服务
 * @author Andrew_Huang
 * @export
 * @class MessageService
 */
export class MessageService
{
    public static instance: MessageService;
    public static getInstance(): MessageService
    {
        if (!this.instance)
        {
            this.instance = new MessageService();
        }
        return this.instance;
    }

    public constructor()
    {

    }

    public pushMessageByUids(uids: any, route: string, msg: any, callback: Function, context: Object): void
    {
        pomelo.app.get('channelService').pushMessageByUids(route, msg, uids, () =>
        {
            callback.call(context);
        });
    }

    public pushMessageToPlayer(uid: any, route: string, msg: any, callback: Function, context: Object): void
    {
        this.pushMessageByUids([uid], route, msg, callback, context);
    }
}