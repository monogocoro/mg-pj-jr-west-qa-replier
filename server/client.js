'use strict';
var loopback = require('loopback');
var boot = require('loopback-boot');
var app = module.exports = loopback();
const WebSocket = require('ws');
var ws = new WebSocket('ws://202.229.59.135:9000');

boot(app, __dirname, function(err) {
  if (err) throw err;
});

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

ws.on('open', function open() {
  console.log('opened!');
});

ws.on('message', function incoming(text) {
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
