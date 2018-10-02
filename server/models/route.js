'use strict';
require
// import {interpreter} from '../jrw.js';
//var interpreter = require('../jrw.js');
var interpreter = require('../../JRW-NLU/jrw');

module.exports = function(Route) {
  Route.prototype.interpret = function(text) {
    return interpreter(text)
  };
};
