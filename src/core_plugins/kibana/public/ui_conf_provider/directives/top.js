import _ from 'lodash';
import $ from 'jquery';
import uiModules from 'ui/modules';
import uiConfTopTemplate from './top.html';

uiModules
.get('apps/discover')
.directive('uiConfTop', function (config) {
  return {
    restrict: 'E',
    replace: true,
    template: uiConfTopTemplate,
    scope : {
      size: '=sampleSize',
      sizeRange: '=sizeRange'
    },
    controller: function ($scope) {
      let defSizes = [500, 1000, 5000, 10000];
      //let yml_sampleSize =  config.get('discover:sampleSize');
      let ymlSampleSize = $scope.size;
      //console.log(config.get('discover:sampleSize'));

      let sizeRange = $scope.sizeRange || [];
      //defSizes = _.concat(defSizes, sizeRange);
      defSizes = _(defSizes).concat(sizeRange).push(ymlSampleSize).uniq().sortBy().value();

      $scope.sizeArray = defSizes;
    }
  };
});
