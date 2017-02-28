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
      size: '=sampleSize'
    },
    controller: function ($scope) {
      let def_Sizes = [500, 1000, 5000, 10000, 50000];
      //let yml_sampleSize =  config.get('discover:sampleSize');
      let yml_sampleSize = $scope.size;
      console.log(config.get('discover:sampleSize'));

      let find = def_Sizes.find((n) => n == yml_sampleSize);
      if (typeof (find) === 'undefined') {
        def_Sizes.push(yml_sampleSize);
        def_Sizes.sort((a, b) => a - b);
      }

      $scope.sizeArray = def_Sizes;
    }
  };
});
