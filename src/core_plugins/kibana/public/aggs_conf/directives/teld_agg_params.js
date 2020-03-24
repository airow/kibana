import IndexedArray from 'ui/indexed_array';
import _ from 'lodash';
import $ from 'jquery';
import aggSelectHtml from './teld_agg_select.html';
import advancedToggleHtml from 'plugins/kibana/visualize/editor/advanced_toggle.html';
import 'ui/filters/match_any';
import './teld_agg_param';
import AggTypesIndexProvider from 'ui/agg_types/index';
import uiModules from 'ui/modules';
import aggParamsTemplate from './teld_agg_params.html';
import editorHtml_string from './../controls/teld_string.html';
import editorHtml_format from './../controls/teld_format.html';
import editorHtml_field from './../controls/teld_field.html';
import AggTypesParamTypesStringProvider from 'ui/agg_types/param_types/string';

uiModules
.get('app/aggs_conf')
  .directive('teldEditorAggParams', function ($compile, $parse, Private, Notifier, $filter, aggsConfSrv) {
  const aggTypes = Private(AggTypesIndexProvider);
  const stringParamTypes = Private(AggTypesParamTypesStringProvider);

  const notify = new Notifier({
    location: 'visAggGroup'
  });

  return {
    restrict: 'E',
    template: aggParamsTemplate,
    scope: true,
    link: function ($scope, $el, attr) {
      $scope.$bind('agg', attr.agg);
      $scope.$bind('groupName', attr.groupName);

      var mapping = aggsConfSrv.labelMapping;
      var filterArray = _.keys(mapping);
      var filterTypeOptions = _.filter(aggTypes.byType.metrics, item => {
        var returnValue = _.includes(filterArray, item.name);
        // var returnValue = false === _.isNil(title);
        if (returnValue) {
          var title = mapping[item.name].title;
          item.title = title;
        }
        return returnValue;
      });
      $scope.aggTypeOptions = filterTypeOptions;
      $scope.advancedToggled = false;

      // this will contain the controls for the schema (rows or columns?), which are unrelated to
      // controls for the agg, which is why they are first
      const $schemaEditor = $('<div>').addClass('schemaEditors').appendTo($el);

      if ($scope.agg.schema.editor) {
        $schemaEditor.append($scope.agg.schema.editor);
        $compile($schemaEditor)($scope.$new());
      }

      // allow selection of an aggregation
      const $aggSelect = $(aggSelectHtml).appendTo($el);
      $compile($aggSelect)($scope);

      // params for the selected agg, these are rebuilt every time the agg in $aggSelect changes
      let $aggParamEditors; //  container for agg type param editors
      let $aggParamEditorsScope;
      $scope.$watch('agg.type', function updateAggParamEditor(newType, oldType) {
        if ($aggParamEditors) {
          $aggParamEditors.remove();
          $aggParamEditors = null;
        }

        // if there's an old scope, destroy it
        if ($aggParamEditorsScope) {
          $aggParamEditorsScope.$destroy();
          $aggParamEditorsScope = null;
        }

        // create child scope, used in the editors
        $aggParamEditorsScope = $scope.$new();
        $aggParamEditorsScope.indexedFields = $scope.agg.getFieldOptions();

        const agg = $scope.agg;
        if (!agg) return;

        const type = $scope.agg.type;

        if (newType !== oldType) {
          // don't reset on initial load, the
          // saved params should persist
          agg.resetParams();
        }

        if (!type) return;

        const aggParamHTML = {
          basic: [],
          advanced: []
        };

        // build collection of agg params html
        type.params.forEach(function (param, i) {
          let aggParam;

          if ($aggParamEditorsScope.indexedFields) {
            const hasIndexedFields = $aggParamEditorsScope.indexedFields.length > 0;
            const isExtraParam = i > 0;
            if (!hasIndexedFields && isExtraParam) { // don't draw the rest of the options if their are no indexed fields.
              return;
            }
          }


          let type = 'basic';
          if (param.advanced) type = 'advanced';

          if (aggParam = getAggParamHTML(param, i)) {
            aggParamHTML[type].push(aggParam);
          }
        });



        // compile the paramEditors html elements
        let paramEditors = aggParamHTML.basic;

        // if (aggParamHTML.advanced.length) {
        //   paramEditors.push($(advancedToggleHtml).get(0));
        //   paramEditors = paramEditors.concat(aggParamHTML.advanced);
        // }

        $aggParamEditors = $(paramEditors).appendTo($el);
        $compile($aggParamEditors)($aggParamEditorsScope);
      });

      // build HTML editor given an aggParam and index
      function getAggParamHTML(param, idx) {
        // don't show params without an editor
        if (!param.editor) {
          return;
        }

        //åŽ»æŽ‰json
        if (param.name === 'json') {
          return;
        }

        switch (param.name) {
          case "customLabel":
            param.editor = editorHtml_string;
            break;
          case "format":
            param.editor = editorHtml_format;
            break;

          case "field":
            param.editor = editorHtml_field;
            break;
        }

        const attrs = {
          'agg-param': 'agg.type.params[' + idx + ']'
        };

        if (param.advanced) {
          attrs['ng-show'] = 'advancedToggled';
        }

        return $('<teld-agg-param-editor>')
        .attr(attrs)
        .append(param.editor)
        .get(0);
      }
    }
  };
});