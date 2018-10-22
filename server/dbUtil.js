'use strict';

var mongoose = require('mongoose');
var sessionSchema = new mongoose.Schema({
  id: String,
  date: Date,
  type: String,
  param: String,
}, {collection: 'sessions'});
var sessionModel = mongoose.model('sessions', sessionSchema);

module.exports = class DbUtil {
  constructor(dsn) {
    mongoose.connect(dsn, {useNewUrlParser: true});
  }
  destructor() {
    mongoose.disconnect();
  };
  getSessionList(query, limit, page, callback) {
    return new Promise(function(resolve, reject) {
      let tmpQuery = query != null ? query : {};
      let tmpPage = page != null ? page : 0;
      sessionModel.find(tmpQuery, {}, {sort: {date: -1}, skip: page * limit, limit: limit}, function(err, docs) {
        resolve(docs);
      });
    });
  };
  getSessionData(query, callback) {
    return new Promise(function(resolve, reject) {
      let tmpQuery = query != null ? query : {};
      sessionModel.findOne(tmpQuery, function(err, docs) {
        resolve(docs);
      });
    });
  }
};
