'use strict';
var loopback = require('loopback');
var boot = require('loopback-boot');
var app = module.exports = loopback();

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;
});

var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({'port': 12002});
var Reply = app.models.reply;


var connections = [];
wss.on('connection', function(ws) {
  console.log('connected');
  ws.on('message', function(text) {

    var reply = new Reply({input: text});
    reply.isValid(function (valid) {
      var result = JSON.parse(JSON.stringify(reply));
      if (!valid) {
        result["errors"] = JSON.parse(JSON.stringify(reply.errors));
      }
      ws.send(JSON.stringify(result));
    });
  });
});

module.exports.closeServer = function() {
  wss.close();
};
