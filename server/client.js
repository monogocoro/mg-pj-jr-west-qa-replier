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

var route = new Route();
var result = route.interpret('金閣寺に行きたいんだけど');

console.log(result);

var reply = new Reply({input: 'aa', api: 'replyData', param: {} });
reply.isValid(function (valid) {
  if (!valid) {
    reply.param.errors = JSON.parse(JSON.stringify(reply.errors));
  }
  var result = JSON.parse(JSON.stringify(reply));
  console.log(JSON.stringify(result));
});

var json = '{"param":{"errors":{"input":["is not included in the list"]}},"input":"aa","api":"replyData"}'
var result = JSON.parse(json);

console.log(result);

ws.on('open', function open() {
  console.log('opened!');

});

ws.on('message', function incoming(json) {
  console.log(json);
  var jsonObj = JSON.parse(json);
  var text = jsonObj['param']['text']
  var reply = new Reply({input: text, api: 'replyData', param: {} });

  reply.isValid(function (valid) {
    var result;

    if (!valid) {
      // result = JSON.parse(JSON.stringify(reply));
      console.log(reply.errors);
      // var json = '{"errors":{"input":["is not included in the list"]}}'
      // reply.param.errors = JSON.parse(json);
      reply.param.errors = reply.errors;
    } else {
      if (reply.willSuggest()) {
        reply.param.suggestions = suggestions.filter(function(value) {
          return value.key == reply.input;
        });
      } else {
        var route = new Route();
        reply.param = route.interpret(reply.input);
        // reply.content = routes.filter(function(value) {
        //   return reply.input.indexOf(value.key) != -1;
        // })[0];
      }
    }
    result = JSON.parse(JSON.stringify(reply));
    console.log('result:' + JSON.stringify(result));

    ws.send(JSON.stringify(result));
  });
});
