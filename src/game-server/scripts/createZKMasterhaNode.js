#!/usr/bin/env node

var zookeeper = require('node-zookeeper-client');
var path = require('path')
var host = process.argv[2] || '127.0.0.1:2181'
var client = zookeeper.createClient(host);
var zkPath = process.argv[3] || '/pomelo/master';

var tmpL = zkPath.split('/');
if (tmpL.length !== 3 || tmpL[0].length > 0 || tmpL[1].length === 0 || tmpL[2].length === 0) {
  console.log('Please input a valid path (depth=2, like:/pomelo/master).');
  return;
}

client.once('connected', function () {
  console.log('Connected to the server.');

  var firstNode = path.dirname(zkPath);
  client.create(firstNode, function (err_1) {
    if (err_1) {
      console.log('Failed to create node: %s. Due to: %s.', firstNode, err_1);
    } else {
      console.log('Node: %s is created successfully.', firstNode);
    }

    client.create(zkPath, function (err_2) {
      if (err_2) {
        console.log('Failed to create node: %s. Due to: %s.', zkPath, err_2);
      } else {
        console.log('Node: %s is created successfully.', zkPath);
      }
      client.close();
    });

  });

});

client.connect();

