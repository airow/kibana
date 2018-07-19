import _ from 'lodash';
import moment from 'moment';
import $ from 'jquery';
import template from './backend_export.html';
import uiModules from 'ui/modules';
import 'plugins/kibana/advanced_search/state/teld_state';
import 'plugins/kibana/backend_export/services/backend_export_service';

uiModules
  .get('apps/backendexport')
  .directive('teldBackendExport', function (Private, $compile, kbnUrl, $interval, backendExportService, Notifier) {

    return {
      restrict: 'E',
      template: template,/** 不能使用这种方式 */
      scope: {
        savedObject: '=',
        urlPrefix: '@',
        export: '&',
        // optional make-url attr, sets the userMakeUrl in our scope
        userMakeUrl: '=?makeUrl',
        // optional on-choose attr, sets the userOnChoose in our scope
        userOnChoose: '=?onChoose',
      },
      controllerAs: 'finder',
      controller: function ($scope) {
        let self = this;

        const notify = new Notifier();

        self.pageIndex = 0;

        self.export = function ($event) {
          $scope.export();
        };

        self.backendexport = function ($event) {
          $scope.savedObject.searchSource.source()._flatten().then(function (flatSource) {
            backendExportService.export($scope.savedObject, flatSource).then(
              /** resolve */
              res => {
                if (_.isEmpty(res.data.error)) {
                  notify.info('导入任务创建成功 TaskID:' + res.data.TaskId);
                  self.query();
                } else {
                  notify.warning(res.data.error);
                  //alert(res.data.error);
                }
              },
              /** reject */
              function () {
                $scope.exportList = [];
              }
            );
          });
        };

        self.fomartDate = function (task) {
          return moment(task.StartTime).format('YYYY-MM-DD HH:mm:ss');
        };

        self.previous = function () {
          if (self.pageIndex <= 0) {
            return;
          }
          self.pageIndex = self.pageIndex - 1;
          self.query();
        };

        self.next = function () {
          if (self.pageIndex + 1 >= $scope.totalPageNum) {
            return;
          }
          self.pageIndex = self.pageIndex + 1;
          self.query();
        };

        self.query = function ($event) {
          debugger;
          var indexPattern = $scope.savedObject.searchSource.get('index');
          backendExportService.tasklist(indexPattern.id, self.pageIndex, 5).then(
            /** resolve */
            res => {
              if (_.isEmpty(res.data.error)) {
                $scope.dataTotls = res.data.dataTotls;
                $scope.totalPageNum = res.data.totalPageNum;
                $scope.exportList = res.data.data;
              } else {
                alert(res.data.error);
              }
            },
            /** reject */
            function (err) {
              $scope.exportList = [];
              notify.warning('导出服务异常:' + err.statusText);
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

        let timer = $interval(() => {
          console.log('.');
          self.query();
        }, 15000);

        $scope.$on('$destroy', () => {
          console.log('+');
          $interval.cancel(timer);
        });

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
