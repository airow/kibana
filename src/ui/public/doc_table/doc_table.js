import _ from 'lodash';
import html from 'ui/doc_table/doc_table_zh_CN.html';
import getSort from 'ui/doc_table/lib/get_sort';
import 'ui/doc_table/doc_table.less';
import 'ui/directives/truncated';
import 'ui/directives/infinite_scroll';
import 'ui/doc_table/components/table_header';
import 'ui/doc_table/components/table_row';
import uiModules from 'ui/modules';

uiModules.get('kibana')
  .directive('docTable', function (config, Notifier, getAppState, $timeout) {
    return {
      restrict: 'E',
      template: html,
      scope: {
        sorting: '=',
        columns: '=',
        hits: '=?', // You really want either hits & indexPattern, OR searchSource
        indexPattern: '=?',
        searchSource: '=?',
        savedObj: '=?',
        infiniteScroll: '=?',
        filter: '=?',
      },
      link: function ($scope) {
        let notify = new Notifier();
        $scope.limit = 50;
        $scope.persist = {
          sorting: $scope.sorting,
          columns: $scope.columns
        };

        $scope.din = false;
        if (_.get($scope, 'savedObj.uiConf.fixedHeader', false)) {
          $timeout(function () {
            $scope.din = false;
            $scope.changePin();
          }, (function () {
            var userAgent = navigator.userAgent;
            if (userAgent.indexOf("Safari") > -1 && userAgent.indexOf("Chrome") < 1) {
              return true;
            }
            else {
              return false;
            }
          })() ? 2500 : 1500);
        }

        $scope.changePin = function () {
          $scope.din = !$scope.din;
          if (_.has($scope, 'savedObj.uiConf')) {
            _.set($scope, 'savedObj.uiConf.fixedHeader', $scope.din);
          }
          $scope.$emit('ppin', $scope.din);
        };
        $scope.$emit('ppin', $scope.din);


        $scope.$emit('FromSelf', { divName: 'Self', description: '向父传播数据' });
        $scope.$on('FromSelf', function (event, data) {
          debugger;
          alert(1);
          //$window.alert("当前节点" + event.currentScope.name + ",截获到了来自" + data.divName + "的事件：" + event.name + "，它的作用是" + data.description);
        });

        let prereq = (function () {
          let fns = [];

          return function register(fn) {
            fns.push(fn);

            return function () {
              fn.apply(this, arguments);

              if (fns.length) {
                _.pull(fns, fn);
                if (!fns.length) {
                  $scope.$root.$broadcast('ready:vis');
                }
              }
            };
          };
        }());

        $scope.addRows = function () {
          $scope.limit += 50;
        };

        $scope.selectRowStyle = function (row) {
          var style = {};
          if (this.$root.embedded && row._id === this.$root.embedded.selectRowId) {
            style = { color: 'rgba(50, 172, 45, 0.97)' };
          }
          return style;
        }

        $scope.selectedID;
        $scope.selectRow = function (row) {
          if ($scope.selectedID === row._id) {
            // delete $scope.selectedID;
          } else {
            $scope.selectedID = row._id;
          }
        }

        // This exists to fix the problem of an empty initial column list not playing nice with watchCollection.
        $scope.$watch('columns', function (columns) {
          if (columns.length !== 0) return;

          let $state = getAppState();
          $scope.columns.push('_source');
          if ($state) $state.replace();
        });

        $scope.$watchCollection('columns', function (columns, oldColumns) {
          if (oldColumns.length === 1 && oldColumns[0] === '_source' && $scope.columns.length > 1) {
            _.pull($scope.columns, '_source');
          }

          if ($scope.columns.length === 0) $scope.columns.push('_source');
        });


        $scope.$watch('searchSource', prereq(function (searchSource) {
          if (!$scope.searchSource) return;

          $scope.indexPattern = $scope.searchSource.get('index');

          //$scope.searchSource.size(config.get('discover:sampleSize'));
          $scope.searchSource.size($scope.savedObj.uiConf.pageSize || config.get('discover:sampleSize'));
          $scope.searchSource.sort(getSort($scope.sorting, $scope.indexPattern));

          // Set the watcher after initialization
          $scope.$watchCollection('sorting', function (newSort, oldSort) {
            // Don't react if sort values didn't really change
            if (newSort === oldSort) return;
            $scope.searchSource.sort(getSort(newSort, $scope.indexPattern));
            $scope.searchSource.fetchQueued();
          });

          $scope.$on('$destroy', function () {
            if ($scope.searchSource) $scope.searchSource.destroy();
          });

          // TODO: we need to have some way to clean up result requests
          $scope.searchSource.onResults().then(function onResults(resp) {
            // Reset infinite scroll limit
            $scope.limit = 50;
            //$scope.limit = $scope.savedObj.uiConf.pageSize

            // Abort if something changed
            if ($scope.searchSource !== $scope.searchSource) return;

            $scope.hits = resp.hits.hits;

            let results = {
              indexPattern: $scope.indexPattern,
              columns: $scope.columns,
              //savedSearch: savedSearch,
              rows: resp.hits.hits
            };

            //2017-02-17 00:32:09 父子通信
            $scope.$emit('doc_table.hits.onResults', results);

            return $scope.searchSource.onResults().then(onResults);
          }).catch(notify.fatal);

          $scope.searchSource.onError(notify.error).catch(notify.fatal);
        }));

      }
    };
  });
