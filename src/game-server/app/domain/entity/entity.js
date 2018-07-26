
var util = require('util');

var Entity = function(opts) {  
  this.createTime = opts.createTime || Date.now();
};

module.exports = Entity;