import ConfigCache = require('../../cache/ConfigCache');

/**
 * 服务区基础数据
 * @author Andrew_Huang
 * @export
 * @class Area
 */
export class Area
{
    private _areaId: number;    //游戏区唯一编号
    private _type: number;      //
    private _map: any;          //
    private _mongoClient: any;  //
    private _players: any;      //
    private _users: any;        //
    private _entities: any;     //
    private _zones: any;        //
    private _items: any;        //
    private _channel: number;   //渠道
    private _playerNum: number; //
    private _emptyTime: number; //时间

    public constructor(opts: any)
    {
        this.init(opts);
    }

    private init(opts: any): void
    {
        this._areaId = opts.id;
        this._type = opts.type;
        this._map = opts.map;
        //db config
        this._mongoClient = null;
        //The map from player to entity
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

    /**
     * 加载缓存配置数据
     * @author Andrew_Huang
     * @private
     * @memberof Area
     */
    private start(): void
    {
        ConfigCache.ConfigCache.getInstance().load();
    }

    public get areaId(): number
    {
        return this._areaId;
    }

    public get type(): number
    {
        return this._type;
    }

    public get map(): any
    {
        return this._map;
    }

    public get mongoClient(): any
    {
        return this._mongoClient;
    }

    public get players(): any
    {
        return this._players;
    }

    public get users(): any
    {
        return this._users;
    }

    public get entities(): any
    {
        return this._entities;
    }

    public get zones(): any
    {
        return this._zones;
    }

    public get items(): any
    {
        return this._items;
    }

    public get channel(): number
    {
        return this._channel;
    }

    public get playerNum(): number
    {
        return this._playerNum;
    }

    public get emptyTime(): number
    {
        return this._emptyTime;
    }
}