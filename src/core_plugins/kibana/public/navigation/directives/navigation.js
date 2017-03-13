import _ from 'lodash';
import $ from 'jquery';
import template from './navigation.html';
import uiModules from 'ui/modules';

uiModules
.get('apps/navigation')
.directive('teldNavigation', function (Private, $compile, kbnUrl, AdvancedSearchState) { 

  return {
    restrict: 'E',
    template: template,/** 不能使用这种方式 */
    scope: {
      savedObject: '=',
      // optional make-url attr, sets the userMakeUrl in our scope
      userMakeUrl: '=?makeUrl',
      // optional on-choose attr, sets the userOnChoose in our scope
      userOnChoose: '=?onChoose',
    },
    controllerAs: 'finder',
    controller: function ($scope) {
      let self = this;
      $scope.referer = $scope.savedObject.title;       

      if ($scope.savedObject.uiConf) {
        $scope.navigation = $scope.savedObject.uiConf.navigation.filter(nav => {
          return !nav.disabled;
        });
      }

      self.makeUrl = function (hit) {
        if ($scope.userMakeUrl) {
          return $scope.userMakeUrl(hit);
        }

        if (!$scope.userOnChoose) {
          return hit.url;
        }

        return '#';
      };

      self.preventClick = function ($event) {
        $event.preventDefault();
      };

      /**
       * Called when a hit object is clicked, can override the
       * url behavior if necessary.
       */
      self.onChoose = function (hit, $event) {
        if ($scope.userOnChoose) {
          $scope.userOnChoose(hit, $event);
        }

        let url = self.makeUrl(hit);
        if (!url || url === '#' || url.charAt(0) !== '#') return;

        $event.preventDefault();

        // we want the '/path', not '#/path'
        //kbnUrl.change(url.substr(1));
        kbnUrl.changeAttchState(url.substr(1), [new AdvancedSearchState()]);
      };
    }
  };
})