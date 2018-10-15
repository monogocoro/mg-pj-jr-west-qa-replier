'use strict';
// import {interpreter} from '../jrw.js';
// var interpreter = require('../jrw.js');
var interpreter = require('../../JRW-NLU/jrw');

module.exports = function(Route) {
  Route.prototype.interpret = function(lang, mode, text) {
    return interpreter(lang, mode, text);
  };
};
