import logger from './logger';

/**
 * 路由工具
 * @author Andrew_Huang
 * @export
 * @class RouteUtil
 */
export class RouteUtil
{
    public constructor()
    {

    }

    public static instance: RouteUtil;
    public static getInstance(): RouteUtil
    {
        if (!this.instance)
        {
            this.instance = new RouteUtil();
        }
        return this.instance;
    }

    /**
     * 路由服务区
     * @author Andrew_Huang
     * @param {*} session
     * @param {*} msg
     * @param {*} app
     * @param {*} callback
     * @memberof RouteUtil
     */
    public area(session: any, msg: any, app: any, callback: any): void
    {
        let serverId = session.get('serverId');
        let playerId = session.get('playerId');
        let ispush = false;
        logger.debug('server info for id::%s, playerId:%d.', (serverId || ''), (playerId || 0));
        if (!serverId)
        {
            let areaId = msg && msg.args && msg.args.length > 0 && msg.args[0].body ? msg.args[0].body.areaId : false;
            if (!areaId)
            {
                logger.error('can not find server info for type::%s.', msg.serverType);
                callback(new Error('can not find server info for type: ' + msg.serverType));
                return;
            }
            //when new create role
            serverId = app.get('areaIdMap')[areaId];
            if (!serverId)
            {
                callback(new Error('can not find server info for type: ' + msg.serverType));
                return;
            }
            session.set('areaId', areaId);
            session.set('serverId', serverId);
            ispush = true
        }
        if (!playerId)
        {
            let playerId = msg.args[0].body.playerId;
            if (playerId)
            {
                session.set('playerId', playerId);
                ispush = true
            }
        }
        if (ispush)
        {
            session.pushAll();
        }
        callback(null, serverId);
    }

    /**
     * 路由到连接服务器
     * @author Andrew_Huang
     * @param {*} session
     * @param {*} msg
     * @param {*} app
     * @param {*} cb
     * @memberof RouteUtil
     */
    public connector(session: any, msg: any, app: any, callback: any): void
    {
        if (!session)
        {
            callback(new Error('fail to route to connector server for session is empty'));
            return;
        }
        if (!session.frontendId)
        {
            callback(new Error('fail to find frontend id in session'));
            return;
        }
        console.log(msg + ":" + app)
        callback(null, session.frontendId);
    }
}