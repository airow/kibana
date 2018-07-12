import _ from 'lodash';
import $ from 'jquery';
import template from './backend_export.html';
import uiModules from 'ui/modules';
import 'plugins/kibana/advanced_search/state/teld_state';
import 'plugins/kibana/backend_export/services/backend_export_service';

uiModules
  .get('apps/backendexport')
  .directive('teldBackendExport', function (Private, $compile, kbnUrl, $interval, backendExportService) {

    return {
      restrict: 'E',
      template: template,/** 不能使用这种方式 */
      scope: {
        savedObject: '=',
        urlPrefix: '@',
        // optional make-url attr, sets the userMakeUrl in our scope
        userMakeUrl: '=?makeUrl',
        // optional on-choose attr, sets the userOnChoose in our scope
        userOnChoose: '=?onChoose',
      },
      controllerAs: 'finder',
      controller: function ($scope) {
        let self = this;

        self.export = function ($event) {
          backendExportService.export().then(
            /** resolve */
            res => {
              if (_.isEmpty(res.data.error)) {
                self.query();
              } else {
                alert(res.data.error);
              }
            },
            /** reject */
            function () {
              $scope.exportList = [];
            }
          );
        };

        self.query = function ($event) {
          backendExportService.tasklist().then(
            /** resolve */
            res => {
              if (_.isEmpty(res.data.error)) {
                $scope.exportList = res.data.data;
              } else {
                alert(res.data.error);
              }
            },
            /** reject */
            function () {
              $scope.exportList = [];
            }
          );
        };

        self.query();

        self.makeUrl = function (task) {
          return backendExportService.url + task.FileUrl;
        };

        self.preventClick = function ($event) {
          $event.preventDefault();
        };

        // let timer = $interval(() => {
        //   console.log('.');
        //   self.query();
        // }, 5000);

        // $scope.$on('$destroy', () => {
        //   console.log('+');
        //   $interval.cancel(timer);
        // });

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
