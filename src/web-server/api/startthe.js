/* var pushDataToSd = require('../../shared/sd/pushDataToSd'); */
var consts = require('./consts');
var routerpath = '/api/startthe';
var os = require('os');

var routeHandle = function (router) {
    router.post(routerpath, function (req, res) {
        var body = req.body;
        var params = {};

        var localhost = '';
        try {
            var network = os.networkInterfaces();
            localhost = network[Object.keys(network)[0]][1].address;
        } catch (e) {
            localhost = 'localhost';
        }
        params.IP = localhost;

        params.ActType = 0;
        params.DeviceModel = body.DeviceModel || '';
        params.ScreenX = body.ScreenX || '';
        params.ScreenY = body.ScreenY || '';
        params.Platform = body.Platform || '';
        params.DeviceVer = body.DeviceVer || '';
        params.NetMode = body.NetMode || '';

        /* pushDataToSd.pushLogin(params); */

        res.send({
            code: consts.RES_CODE.SUC_OK,
            msg: ''
        });
    })
};

module.exports = routeHandle;