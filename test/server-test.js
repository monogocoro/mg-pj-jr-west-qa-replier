'use strict';
var WebSocket = require('ws');
var server = require('../server/server.js');
var ws = new WebSocket('ws://localhost:12002/');

it('to check if data is received', function(done) {
  ws.on('open', function open() {
    ws.send('I AM SERVER-TEST.JS LOL');
    done();
  });

  ws.on('message', function incoming(data) {
    console.log(data);
    server.closeServer();
  });
});
