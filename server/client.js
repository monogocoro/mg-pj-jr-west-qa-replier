'use strict';
var loopback = require('loopback');
var boot = require('loopback-boot');
var app = module.exports = loopback();
const WebSocket = require('ws');

boot(app, __dirname, function(err) {
  if (err) throw err;
});

var Reply = app.models.reply;
var Suggestion = app.models.suggestion;
var Route = app.models.route;
var reconnectInterval = 1000 * 3;

var ws = null;
function connectServer() {
  ws = null;
  //ws = new WebSocket('ws://202.229.59.135:9000');
  ws = new WebSocket('ws://127.0.0.1:9000');
  ws.on('open', function open() {
    console.log('ws opened!');
  });

  ws.on('message', function incoming(json) {
    console.log(json);
    var jsonObj = JSON.parse(json);
    var text = jsonObj['param']['text'];
    var uuid = jsonObj['param']['id'];
    var reply = new Reply({input: text, api: 'replyData', param: {}});
    // var reply = new Reply({api: 'replyData', param: {} });
    try {
      reply.isValid(function(valid) {
        var result;
  
        if (!valid) {
          console.log(reply.errors);
          reply.param.errors = reply.errors;
        } else {
          var route = new Route();
          reply.param = {id: uuid, query: JSON.parse(route.interpret(reply.input)), input: text};
        }
        result = JSON.parse(JSON.stringify(reply));
        console.log('result:' + JSON.stringify(result));
        ws.send(JSON.stringify(result));
      });
    } catch (error) {
      var result;
      reply.param.errors = 'something wrong';
      result = JSON.parse(JSON.stringify(reply));
      console.log('result:' + JSON.stringify(result));
      ws.send(JSON.stringify(result));
    }
  });
  ws.on('error', function() {
    console.log('ws error');
  });
  ws.on('close', function() {
    console.log('ws close');
    setTimeout(connectServer, reconnectInterval);
  });
};
connectServer();
