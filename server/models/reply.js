'use strict';

module.exports = function(Reply) {
  Reply.validatesInclusionOf('input', {in: ['金閣寺','金閣寺に行きたい', '大阪駅', '大阪駅に行きたい', 'ATM', 'ATMはどこですか']});
  Reply.prototype.willSuggest = function() {
    var re = /^(金閣寺|大阪駅|ATM)$/g;
    return this.input.match(re)
  };
};
