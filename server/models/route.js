'use strict';
require
// import {interpreter} from '../jrw.js';
var interpreter = require('../jrw.js');

module.exports = function(Route) {
  Route.prototype.interpret = function(text) {
    return interpreter(text)
  };
};
