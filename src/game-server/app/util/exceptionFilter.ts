import logger from './logger';

export = function (): any {
    return new ExceptionFilter();
}

class ExceptionFilter {
    before(msg: any, session: any, next: any): void {
        try {
            consoleLog("filter before", msg, session);
            next();
        }
        catch (err) {
            consoleLog("filter before--catch", msg, session);
            next(err);
        }
    }

    after(err: any, msg: any, session: any, _resp: any, next: any): void {
        consoleLog("filter after", msg, session);
        next(err);
    };
}

function consoleLog(desc: any, msg: any, session: any): void {
    logger.debug(`${desc}, uid:${session.uid}, sessionId:${session.id}, reqNum:${session.__timeout__}, frontendId:${session.frontendId}, msg:${JSON.stringify(msg)}`);
}