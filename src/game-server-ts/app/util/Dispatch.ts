// import crc = require('crc');

/**
 * 派发
 * @author Andrew_Huang
 * @export
 * @class Dispatch
 */
export class Dispatch
{
    public static instance: Dispatch;
    public static getInstance(): Dispatch
    {
        if (!this.instance)
        {
            this.instance = new Dispatch();
        }
        return this.instance;
    }

    public static dispatch(uid: number, connectors: any[]): any
    {
        var index = Number(uid) % connectors.length;
        return connectors[index];
    }
}