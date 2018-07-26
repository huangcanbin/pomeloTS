var pomelo = require('pomelo');
var ConfigCache = require('../../cache/configCache');
var logger = require('pomelo-logger').getLogger(__filename);

/**
 * Init areas
 * @param {Object} opts
 * @api public
 */
var Instance = function (opts) {
    this.areaId = opts.id;
    this.type = opts.type;
    this.map = opts.map;

    //db config
    this.mongoClient = null;

    //The map from player to entity
    this.players = {};
    this.users = {};
    this.entities = {};
    this.zones = {};
    this.items = {};
    this.channel = null;

    this.playerNum = 0;
    this.emptyTime = Date.now();
    //Init AOI
    //   this.aoi = aoiManager.getService(opts);

    //   this.aiManager = ai.createManager({area:this});
    //   this.patrolManager = patrol.createManager({area:this});
    //   this.actionManager = new ActionManager();

    //   this.timer = new Timer({
    //     area : this,
    //     interval : 100
    //   });
    this.start();
};

module.exports = Instance;

/**
 * @api public
 */
Instance.prototype.start = function () {
    ConfigCache.load();
};

Instance.prototype.close = function () {

};
