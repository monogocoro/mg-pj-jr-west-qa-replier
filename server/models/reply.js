'use strict';

module.exports = function(Reply) {
  Reply.validatesInclusionOf('input', {in: ['金閣寺','金閣寺 知りたい', '大阪駅', '大阪駅 行き方', 'ATM', 'ATM 場所']});
  Reply.prototype.willSuggest = function() {
    var re = /^(金閣寺|大阪駅|ATM)$/g;
    return this.input.match(re)
  };
};
