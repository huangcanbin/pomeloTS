var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename);
var dbDriver = require('../drive/dbDriver');
var utils = require('../util/utils');
var consts = require('../util/consts');

var Task = require('../domain/entity/task');

var taskDao = module.exports;

/**
 * create task object
 */
taskDao.createTask = function (taskId, playerId, areaId, next) {
    var client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("Task", function (err, col, close) {
        if (!!err) {
            close(); //release connect
            utils.invokeCallback(next, err);
            return;
        }
        var player = new Task({
            playerId: playerId,
            taskId: taskId,
            num: 0,
            status: 0
        });
        col.insertOne(player, function (err, res) {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }
            close();
            utils.invokeCallback(next, null);
        });
    });
};