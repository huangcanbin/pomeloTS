Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
class RouteUtil {
    constructor() {
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new RouteUtil();
        }
        return this.instance;
    }
    area(session, msg, app, callback) {
        let serverId = session.get('serverId');
        let playerId = session.get('playerId');
        let ispush = false;
        logger_1.default.debug('server info for id::%s, playerId:%d.', (serverId || ''), (playerId || 0));
        if (!serverId) {
            let areaId = msg && msg.args && msg.args.length > 0 && msg.args[0].body ? msg.args[0].body.areaId : false;
            if (!areaId) {
                logger_1.default.error('can not find server info for type::%s.', msg.serverType);
                callback(new Error('can not find server info for type: ' + msg.serverType));
                return;
            }
            serverId = app.get('areaIdMap')[areaId];
            if (!serverId) {
                callback(new Error('can not find server info for type: ' + msg.serverType));
                return;
            }
            session.set('areaId', areaId);
            session.set('serverId', serverId);
            ispush = true;
        }
        if (!playerId) {
            let playerId = msg.args[0].body.playerId;
            if (playerId) {
                session.set('playerId', playerId);
                ispush = true;
            }
        }
        if (ispush) {
            session.pushAll();
        }
        callback(null, serverId);
    }
    connector(session, msg, app, callback) {
        if (!session) {
            callback(new Error('fail to route to connector server for session is empty'));
            return;
        }
        if (!session.frontendId) {
            callback(new Error('fail to find frontend id in session'));
            return;
        }
        console.log(msg + ":" + app);
        callback(null, session.frontendId);
    }
}
exports.RouteUtil = RouteUtil;
