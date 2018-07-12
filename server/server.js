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
var Suggestion = app.models.suggestion;
var Route = app.models.route;

var suggestions =  [];
suggestions.push(new Suggestion({key: '金閣寺', value: '金閣寺 知りたい'}));
suggestions.push(new Suggestion({key: '大阪駅', value: '大阪駅 行き方'}));
suggestions.push(new Suggestion({key: 'ATM', value: 'ATM 場所'}));

var routes =  [];
routes.push(new Route({key: '金閣寺', value: '金閣寺の観光情報の結果'}));
routes.push(new Route({key: '大阪駅', value: '大阪駅への行き方の結果'}));
routes.push(new Route({key: 'ATM', value: 'ATMの場所情報の結果'}));


var connections = [];
wss.on('connection', function(ws) {
  console.log('connected');
  ws.on('message', function(text) {

    var reply = new Reply({input: text});

    reply.isValid(function (valid) {
      var result;

      if (!valid) {
        result = JSON.parse(JSON.stringify(reply));
        result['errors'] = JSON.parse(JSON.stringify(reply.errors));
      } else {
        if (reply.willSuggest()) {
          reply.content = suggestions.filter(function(value) {
            return value.key == reply.input;
          })[0];
        } else {
          reply.content = routes.filter(function(value) {
            return reply.input.indexOf(value.key) != -1;
          })[0];
        }
        result = JSON.parse(JSON.stringify(reply));
      }

      ws.send(JSON.stringify(result));
    });
  });
});

module.exports.closeServer = function() {
  wss.close();
};
