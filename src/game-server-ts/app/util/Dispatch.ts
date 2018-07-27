// import crc = require('crc');

/**
 * 派发
 * @author Andrew_Huang
 * @export
 * @class Dispatch
 */
export default class Dispatch
{
    public static dispatch(uid: number, connectors: any[]): any
    {
        var index = Number(uid) % connectors.length;
        return connectors[index];
    }
}