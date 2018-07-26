var Area = require('./area');
var exp = module.exports;

var area = null;

/**
 * init
 * @param {object} opts options
 */
exp.init = function (opts) {
  if (!area) {
    opts.weightMap = true;
    area = new Area(opts);
  }
};

exp.getArea = function () {
  return area;
};
