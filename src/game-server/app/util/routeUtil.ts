import logger from './logger';

let exp = {
	area: function (session: any, msg: any, app: any, cb: any): void {
		var serverId = session.get('serverId');
		var playerId = session.get('playerId');
		var ispush = false;

		logger.debug('server info for id::%s, playerId:%d.', (serverId || ''), (playerId || 0));

		if (!serverId) {
			var areaId = msg && msg.args && msg.args.length > 0 && msg.args[0].body
				? msg.args[0].body.areaId
				: false;
			if (!areaId) {
				logger.error('can not find server info for type::%s.', msg.serverType);
				cb(new Error('can not find server info for type: ' + msg.serverType));
				return;
			}
			//when new create role
			serverId = app.get('areaIdMap')[areaId];
			if (!serverId) {
				cb(new Error('can not find server info for type: ' + msg.serverType));
				return;
			}
			session.set('areaId', areaId);
			session.set('serverId', serverId);
			ispush = true
		}
		if (!playerId) {
			var playerId = msg.args[0].body.playerId;
			if (playerId) {
				session.set('playerId', playerId);
				ispush = true
			}
		}
		if (ispush) {
			session.pushAll();
		}
		cb(null, serverId);
	},

	connector: function (session: any, _msg: any, _app: any, cb: any): void {
		if (!session) {
			cb(new Error('fail to route to connector server for session is empty'));
			return;
		}

		if (!session.frontendId) {
			cb(new Error('fail to find frontend id in session'));
			return;
		}

		cb(null, session.frontendId);
	}
}

export default exp;