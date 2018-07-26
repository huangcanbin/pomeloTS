// import crc = require('crc');

export default function dispatch(uid: number, connectors: any[]): any {
	var index = Number(uid) % connectors.length;
	return connectors[index];
};
