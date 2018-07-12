'use strict';

module.exports = function(Reply) {
  Reply.validatesInclusionOf('input', {in: ['金閣寺', '金閣寺 所要時間']});
};
