const logger_1 = require("./logger");
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
    after(err, msg, session, _resp, next) {
        consoleLog("filter after", msg, session);
        next(err);
    }
    ;
}
function consoleLog(desc, msg, session) {
    logger_1.default.debug(`${desc}, uid:${session.uid}, sessionId:${session.id}, reqNum:${session.__timeout__}, frontendId:${session.frontendId}, msg:${JSON.stringify(msg)}`);
}
module.exports = function () {
    return new ExceptionFilter();
};
