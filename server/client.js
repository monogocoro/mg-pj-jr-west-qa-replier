'use strict';
var loopback = require('loopback');
var boot = require('loopback-boot');
var app = module.exports = loopback();
var interpreter = require('../test-jrw-nlu/core');
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
    lang = 'ja' //日本語を強制している
    let result = interpreter(lang, mode, text)
    // if ( result.match(/{"replyJDB":{"greeting":"I'm afraid I haven't information .#申し訳ありません、情報がありません。"}}/)) {
    //   console.log('jdb');
    let table = {
      '授乳室はどこか':'{"queryGDB":"g.V().hasLabel(\'授乳室\').in(\'instanceOf\')"}',
      '多目的トイレはどこか':'{"queryGDB":"g.V().hasLabel(\'多目的トイレ\').in(\'instanceOf\')"}',
      'オムツを替えられる場所はあるか':'{"queryGDB":"g.V().hasLabel(\'location\').where(out(\'change\').hasLabel(\'オムツ\'))"}',
      '喫煙場所はどこか':'{"queryGDB":"g.V().hasLabel(\'喫煙場所\').in(\'instanceOf\')"}',
      'タバコが吸える場所はどこか':'{"queryGDB":"g.V().hasLabel(\'location\').where(out(\'smoke\').hasLabel(\'人\'))"}',
      '喫茶店はどこか':'{"queryGDB":"g.V().hasLabel(\'喫茶店\').in(\'instanceOf\')"}'
    }
    let query = null
    if (query = table[text]) {
      return resolve(query);
    }else {
      let matched = text.match(/(.+)はどこ/)
      if (matched) {
        console.log('matched');
        // return resolve('{"querySDB":{"station":"kyoto#京都","place":{"name":"midorinomadoguchi#'+matched[1]+'"}}}')
        return resolve('{"queryGDB":"g.V().hasLabel(\''+matched[1]+'\').in(\'instanceOf\')"}');
      } else {
        return resolve(result);
      }
    }

    // } else {
    //   return resolve(result);
    // }
    // return resolve(interpreter(lang, mode, text));
    // return resolve('{"queryGDB": ".V().has(\'name\', \'お手洗い\').in(\'instanceOf\')"}');
    // return resolve('{"queryUKN": {"dbtype": "SDB", "istype":"述語関数", "word": "不明単語"}}');
    // return resolve('{"querySDB": {"station": "京都", "place": {"name": "バス乗り場"}}}');
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
    var lang = jsonObj['param']['lang'];
    var log_session_no = jsonObj['param']['log_session_no'];

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
      return analyseText(lang, mode, reply.input, log_session_no);
    })
    .then((query) => {
      var tmpJson = JSON.parse(query);
      if (tmpJson['queryUKN'] != undefined && tmpJson['queryUKN'] != null) {
        if (tmpJson['queryUKN']['words'] == undefined || tmpJson['queryUKN']['words'] == null) {
          throw 'UKN no words';
        }
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
        reply.param = {'id': uuid, 'query': tmpJson, 'input': text};
        var result = JSON.parse(JSON.stringify(reply));
        console.log('result:' + JSON.stringify(result));
        ws.send(JSON.stringify(result));
      }
    })
    .catch((error) => {
      reply.param = {'id': uuid, 'errors': error, 'input': text};
      var result = JSON.parse(JSON.stringify(reply));
      console.log('error:' + JSON.stringify(error));
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
