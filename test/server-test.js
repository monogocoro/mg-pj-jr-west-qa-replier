'use strict';
var WebSocket = require('ws');
var server = require('../server/server');
var assert = require('assert');
var ws = new WebSocket('ws://localhost:12002/');

// TODO: describeで囲うと、incomingがコールされないようだ
// describe('server', () => {
it.skip('returns response', function(done) {
  ws.on('open', function open() {
    ws.send('send to test');
  });
  ws.on('message', function incoming(data) {
    console.log('test received: ' + data);
    try {
      assert.equal(data, 'server received test send.aa');
    }
    finally {
      server.closeServer();
      done();
    }
  });

});
it('"き" -> エラーを返却する', function(done) {
  ws.on('open', function open() {
    ws.send('き');
  });
  ws.on('message', function incoming(data) {
    console.log('test received: ' + data);
    var json = {
      api: 'reply',
      content: null,
      errors: {
        base: ['error'],
      },
    };
    try {
      assert.equal(data, JSON.stringify(json));
    }
    finally {
      server.closeServer();
      done();
    }
  });
});
// });
