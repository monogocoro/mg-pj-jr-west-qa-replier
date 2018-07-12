'use strict';
var WebSocket = require('ws');
var server = require('../server/server');
var assert = require('assert');
var ws = new WebSocket(' ws://localhost:12002');

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
it.skip('"き" -> エラーを返却する', function(done) {
  ws.on('open', function open() {
    ws.send('き');
  });
  ws.on('message', function incoming(data) {
    console.log('test received: ' + data);
    try {
      assert.equal(data, '{"input":"き","errors":{"input":["is not included in the list"]}}');
    }
    finally {
      server.closeServer();
      done();
    }
  });
});
it.skip('"金閣寺" -> 候補を出力する', function(done) {
  ws.on('open', function open() {
    ws.send('金閣寺');
  });
  ws.on('message', function incoming(data) {
    console.log('test received: ' + data);
    try {
      assert.equal(data, '{"content":{"key":"金閣寺","value":"金閣寺 知りたい"},"input":"金閣寺"}');
    }
    finally {
      server.closeServer();
      done();
    }
  });
});
it.skip('"金閣寺 知りたい" -> 結果を出力する', function(done) {
    ws.on('open', function open() {
      ws.send('金閣寺 知りたい');
    });
    ws.on('message', function incoming(data) {
      console.log('test received: ' + data);
      try {
        assert.equal(data, '{"content":{"key":"金閣寺","value":"金閣寺の観光情報の結果"},"input":"金閣寺 知りたい"}');
      }
      finally {
        server.closeServer();
        done();
      }
    });
});

it.skip('"大阪駅" -> 候補を出力する', function(done) {
  ws.on('open', function open() {
    ws.send('大阪駅');
  });
  ws.on('message', function incoming(data) {
    console.log('test received: ' + data);
    try {
      assert.equal(data, '{"content":{"key":"大阪駅","value":"大阪駅　場所"},"input":"金閣寺"}');
    }
    finally {
      server.closeServer();
      done();
    }
  });
});
it.skip('"大阪駅 行き方" -> 結果を出力する', function(done) {
    ws.on('open', function open() {
      ws.send('大阪駅 行き方');
    });
    ws.on('message', function incoming(data) {
      console.log('test received: ' + data);
      try {
        assert.equal(data, '{"content":{"key":"大阪駅","value":"大阪駅への行き方の結果"},"input":"大阪駅 行き方"}');
      }
      finally {
        server.closeServer();
        done();
      }
    });
});

it('"ATM" -> 候補を出力する', function(done) {
  ws.on('open', function open() {
    ws.send('ATM');
  });
  ws.on('message', function incoming(data) {
    console.log('test received: ' + data);
    try {
      assert.equal(data, '{"content":{"key":"ATM","value":"ATM 場所"},"input":"ATM"}');
    }
    finally {
      server.closeServer();
      done();
    }
  });
});
it.skip('"ATM 場所" -> 結果を出力する', function(done) {
    ws.on('open', function open() {
      ws.send('ATM 場所');
    });
    ws.on('message', function incoming(data) {
      console.log('test received: ' + data);
      try {
        assert.equal(data, '{"content":{"key":"ATM","value":"ATMの場所情報の結果"},"input":"ATM 場所"}');
      }
      finally {
        server.closeServer();
        done();
      }
    });
});
// });
