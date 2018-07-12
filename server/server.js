'use strict';
//
// var loopback = require('loopback');
// var boot = require('loopback-boot');
//
// var app = module.exports = loopback();
//
// app.start = function() {
//   // start the web server
//   return app.listen(function() {
//     app.emit('started');
//     var baseUrl = app.get('url').replace(/\/$/, '');
//     console.log('Web server listening at: %s', baseUrl);
//     if (app.get('loopback-component-explorer')) {
//       var explorerPath = app.get('loopback-component-explorer').mountPath;
//       console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
//     }
//   });
// };
//
// // Bootstrap the application, configure models, datasources and middleware.
// // Sub-apps like REST API are mounted via boot scripts.
// boot(app, __dirname, function(err) {
//   if (err) throw err;
//
//   // start the server if `$ node server.js`
//   if (require.main === module)
//     app.start();
// });

var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({'port': 12002});

var connections = [];
wss.on('connection', function(ws) {
  console.log('success');
  ws.on('message', function(json) {
    console.log('I AM SERVER.JS LOL:' + json);
    ws.send('Thank you.');
  });
});

exports.closeServer = function() {
  wss.close();
};
