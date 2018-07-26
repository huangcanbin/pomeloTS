var logger = require('pomelo-logger').getLogger('pomelo', __filename);

module.exports = function () {
    return new ExceptionFilter();
}

class ExceptionFilter {
    before(msg, session, next) {
        try {
            consoleLog("filter before", msg, session);
            next();
        }
        catch (err) {
            consoleLog("filter before--catch", msg, session);
            next(err);
        }
    }

    after(err, msg, session, resp, next) {
        consoleLog("filter after", msg, session);        
        next(err);
    };
}

function consoleLog(desc, msg, session) {
    logger.debug(`${desc}, uid:${session.uid}, sessionId:${session.id}, reqNum:${session.__timeout__}, frontendId:${session.frontendId}, msg:${JSON.stringify(msg)}`);
}