import _ from 'lodash';
import $ from 'jquery';
import template from './navigation.html';
import uiModules from 'ui/modules';
import 'plugins/kibana/advanced_search/state/teld_state';

uiModules
.get('apps/navigation')
.directive('teldLinksNavigation', function (Private, $compile, kbnUrl, TeldState) { 

  return {
    restrict: 'E',
    template: template,/** 不能使用这种方式 */
    scope: {
      savedObject: '=',
      findKey: '@',
      // optional on-choose attr, sets the userOnChoose in our scope
      userOnChoose: '=?onChoose',
    },
    controllerAs: 'finder',
    controller: function ($scope) {
      let self = this;
      $scope.referer = $scope.savedObject.title;
      // alert($scope.findKey);

      if ($scope.savedObject.uiConf) {
        let navigationArray = $scope.savedObject.uiConf.links || [];
        navigationArray = _.find(navigationArray, item => { return item.display == $scope.findKey && _.size(item.items) > 0 });
        navigationArray = navigationArray.items;
        if (_.isObject(navigationArray)) {
          navigationArray = [navigationArray];
        }
        $scope.navigation = navigationArray.filter(nav => {
          let returnValue = !nav.disabled;
          return returnValue;
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
        debugger;
        if ($scope.userOnChoose) {
          $scope.userOnChoose(hit, $event);
        }

        let url = self.makeUrl(hit);
        if (_.startsWith("#", url)) {
          kbnUrl.changeAttchState(url.substr(1), [new TeldState()]);
        } else {
          window.open(url, hit.display);
        }

        $event.preventDefault();

        // we want the '/path', not '#/path'
        //kbnUrl.change(url.substr(1));
        // kbnUrl.changeAttchState(url.substr(1), [new TeldState()]);
      };
    }
  };
})