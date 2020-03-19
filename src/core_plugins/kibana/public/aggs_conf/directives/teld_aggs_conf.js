import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import conditionTemplate from './teld_aggs_conf.html';
import uiModules from 'ui/modules';
import VisAggConfigProvider from 'ui/vis/agg_config';
import 'plugins/kibana/aggs_conf/directives/teld_agg_params';
import 'plugins/kibana/aggs_conf/directives/teld_aggs_conf.less';


import 'ui-select';

uiModules
  .get('apps/aggs_conf', ['ui.select'])
  .directive('teldAggsConf', function (Private, $compile, aggsConfSrv, courier) {
    const AggConfig = Private(VisAggConfigProvider);
    return {
      restrict: 'E',
      // template: conditionTemplate,/** 不能使用这种方式 */
      // scope: {
      //   vis: '='
      // },
      controller: function ($scope) {

        const vis = $scope.vis;



        $scope.groupName = "metrics";
        // const editableVis = $scope.editableVis = vis.createEditableVis();
        // $scope.group = editableVis.aggs.bySchemaGroup[$scope.groupName];
        $scope.$bind('group', 'vis.aggs.bySchemaGroup["' + $scope.groupName + '"]');
        $scope.$bind('schemas', 'vis.type.schemas["' + $scope.groupName + '"]');

        const editableVis = vis.createEditableVis();
        // $scope.$bind('vis', 'editableVis');
        $scope.stageEditableVis = transferVisState(editableVis, vis, true);

        function transferVisState(fromVis, toVis, stage) {
          return function () {

            //verify this before we copy the "new" state
            const isAggregationsChanged = !fromVis.aggs.jsonDataEquals(toVis.aggs);

            // const view = fromVis.getEnabledState();
            // const full = fromVis.getState();
            // toVis.setState(view);
            // editableVis.dirty = false;
            // $state.vis = full;

            /**
             * Only fetch (full ES round trip), if the play-button has been pressed (ie. 'stage' variable) and if there
             * has been changes in the Data-tab.
             */
            if (stage && isAggregationsChanged) {
              $scope.fetch();
            }
          };
        }

        $scope.remove = function (array, item) {
          _.remove($scope.vis.aggs, item);
          _.remove($scope.vis.aggs.raw, item);
          delete $scope.vis.aggs.byId[item.id];
          _.remove($scope.vis.aggs.byTypeName[item.type.name] || [], item);
          _.remove($scope.vis.aggs.bySchemaName.metric, item);
          _.remove($scope.vis.aggs.bySchemaGroup.metrics, item);
          return array;
        };

        $scope.move = function (array, index, newIndex) {
          _.move(array, index, newIndex);
        }

        $scope.submit = function (schema) {
          // self.form = false;

          const aggConfig = new AggConfig($scope.vis, {
            schema: schema
          });
          // aggConfig.brandNew = true;

          $scope.vis.aggs.push(aggConfig);
        };

        $scope.$watchMulti([
          'schemas',
          '[]group'
        ], function () {
          const stats = $scope.stats = {
            min: 0,
            max: 0,
            count: $scope.group ? $scope.group.length : 0
          };

          if (!$scope.schemas) return;

          $scope.schemas.forEach(function (schema) {
            stats.min += schema.min;
            stats.max += schema.max;
            stats.deprecate = schema.deprecate;
          });

          $scope.availableSchema = $scope.schemas.filter(function (schema) {
            const count = _.where($scope.group, { schema }).length;
            if (count < schema.max) return true;
          });
        });
      },
      link: function ($scope, element) {
        const init = function () {
          //var template = conditionTemplate.template;
          var template = conditionTemplate;
          element.html('').append($compile(template)($scope));
        };

        // Start the directive
        init();
      }
    };
  })
