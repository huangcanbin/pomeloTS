// import crc = require('crc');

export default class Dispatch
{
    public static dispatch(uid: number, connectors: any[]): any
    {
        var index = Number(uid) % connectors.length;
        return connectors[index];
    }
}