Object.defineProperty(exports, "__esModule", { value: true });
const ConfigCache = require("../../cache/ConfigCache");
class Area {
    constructor(opts) {
        this.init(opts);
    }
    init(opts) {
        this._areaId = opts.id;
        this._type = opts.type;
        this._map = opts.map;
        this._mongoClient = null;
        this._players = {};
        this._users = {};
        this._entities = {};
        this._zones = {};
        this._items = {};
        this._channel = null;
        this._playerNum = 0;
        this._emptyTime = Date.now();
        this.start();
    }
    start() {
        ConfigCache.ConfigCache.getInstance().load();
    }
    get areaId() {
        return this._areaId;
    }
    get type() {
        return this._type;
    }
    get map() {
        return this._map;
    }
    get mongoClient() {
        return this._mongoClient;
    }
    get players() {
        return this._players;
    }
    get users() {
        return this._users;
    }
    get entities() {
        return this._entities;
    }
    get zones() {
        return this._zones;
    }
    get items() {
        return this._items;
    }
    get channel() {
        return this._channel;
    }
    get playerNum() {
        return this._playerNum;
    }
    get emptyTime() {
        return this._emptyTime;
    }
}
exports.Area = Area;
