'use strict';
var loopback = require('loopback');
var boot = require('loopback-boot');
var app = module.exports = loopback();
var interpreter = require('../../JRW-NLU/jrw');
const WebSocket = require('ws');
var DbUtil = require('./dbUtil');

boot(app, __dirname, function(err) {
  if (err) throw err;
});

var Reply = app.models.reply;
var Suggestion = app.models.suggestion;
var Route = app.models.route;
var reconnectInterval = 1000 * 3;

var ws = null;
function analyseText(lang, mode, text) {
  return new Promise(function(resolve, reject) {
    return resolve(interpreter(lang, mode, text));
    // return resolve('{"queryUKN": {"words":["みどり","金閣寺"]}}');
  });
}
function connectServer() {
  ws = null;
  // ws = new WebSocket('ws://202.229.59.135:9000');
  ws = new WebSocket('ws://127.0.0.1:9000');
  ws.on('open', function open() {
    console.log('ws opened!');
  });

  ws.on('message', function incoming(json) {
    console.log(json);
    var jsonObj = JSON.parse(json);
    var text = jsonObj['param']['text'];
    var uuid = jsonObj['param']['id'];
    var lang = 'japanese';
    if (jsonObj['param']['lang'] == 'en') {
      lang = 'english';
    }
    var mode = jsonObj['param']['mode'];
    var reply = new Reply({input: text, api: 'replyData', param: {}});
    new Promise(function(resolve, reject) {
      reply.isValid(function(valid) {
        if (valid) {
          resolve();
        } else {
          reject('error JSON');
        }
      });
    })
    .then(() => {
      return analyseText(lang, mode, reply.input);
    })
    .then((query) => {
      var tmpJson = JSON.parse(query);
      if (tmpJson['queryUKN'] != undefined && tmpJson['queryUKN'] != null) {
        const dbUtil = new DbUtil('mongodb://localhost/jrwdb');
        let orgreg = '.*(?!(queryUKN|queryJDB)).*(\'|\")input(\'|\"):(\'|\").*(';
        tmpJson['queryUKN']['words'].forEach(word => {
          orgreg +=  word + '|';
        });
        orgreg = orgreg.slice(0, -1);
        orgreg += ').*(\'|\").*';
        let reg = RegExp(orgreg);
        return dbUtil.getSessionList({'$and': [{'type': 'replyData'},
                                                {'param': {$regex: reg}},
                                                {'param': {$regex: /^(?!.*\"query\":{(\"queryUKN\"|\"queryJDB\":\"fail\")).*/}}]}, 3, 0)
        .then((doc) => {
          dbUtil.destructor();
          if (doc.length == 0) {
            throw 'no log';
          } else {
            try {
              var suggestions = [];
              for (var i = 0; i < doc.length; i++) {
                var tmpParam = JSON.parse(doc[i].param);
                var findFlg = false;
                for (var j = 0; j < suggestions.length; j++) {
                  if (suggestions[j].key == tmpParam.input) {
                    findFlg = true;
                    break;
                  }
                }
                if (!findFlg) {
                  suggestions.push({
                    'key': tmpParam.input,
                    'value': tmpParam.input,
                  });
                }
              }
              reply.param = {'id': uuid, 'suggestions': suggestions, 'input': text};
              var result = JSON.parse(JSON.stringify(reply));
              console.log('result:' + JSON.stringify(result));
              ws.send(JSON.stringify(result));
            } catch (error) {
              throw 'error Data';
            }
          }
        });
      } else {
        reply.param = {'id': uuid, 'query': query, 'input': text};
        var result = JSON.parse(JSON.stringify(reply));
        console.log('result:' + JSON.stringify(result));
        ws.send(JSON.stringify(result));
      }
    })
    .catch((error) => {
      reply.param.errors = error;
      var result = JSON.parse(JSON.stringify(reply));
      console.log('result:' + JSON.stringify(result));
      ws.send(JSON.stringify(result));
    });
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
