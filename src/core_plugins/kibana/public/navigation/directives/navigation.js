import _ from 'lodash';
import $ from 'jquery';
import template from './navigation.html';
import uiModules from 'ui/modules';
import 'plugins/kibana/advanced_search/state/teld_state';
import 'plugins/kibana/navigation/services/navigation_conf_service';

uiModules
.get('apps/navigation')
.directive('teldNavigation', function (Private, $compile, kbnUrl, TeldState, navigationConfService) { 

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
        let navigationArray = $scope.savedObject.uiConf.navigation || [];
        let conf_ids_nav = [];
        let conf_ids = [];
        
        navigationArray = navigationArray.filter(nav => {

          let returnValue = !nav.disabled;

          if (returnValue && nav.conf_id) {
            conf_ids_nav.push(nav);
            conf_ids.push(nav.conf_id);
          }

          return returnValue;
        });
        
        navigationConfService.get(conf_ids).then(
          /** resolve */
          navigationConf => {
            conf_ids_nav.forEach(item => {
              let startIndex = navigationArray.indexOf(item);
              let confArray = navigationConf[item.conf_id];

              if (confArray) {
                for (let index = 0; index < confArray.length; index++) {
                  let confItem = confArray[index];
                  if (!confItem.disabled) {
                    navigationArray.splice(startIndex++, 0, confItem);
                  }
                }
              }

              navigationArray.splice(startIndex, 1);
            });

            $scope.navigation = navigationArray;
          },
          /** reject */
          function () {
            $scope.navigation = navigationArray;
          }
        );
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
        kbnUrl.changeAttchState(url.substr(1), [new TeldState()]);
      };
    }
  };
})