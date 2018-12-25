import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import conditionTemplate from './condition.html';
import conditionDisplayTemplate from './condition_display.html';
import '../styles/advanced_search.css';
import uiModules from 'ui/modules';
import './value_selector';

import '../styles/selectize.default.css';
import 'ui-select';

uiModules
.get('apps/advanced_search', ['ui.select'])
.directive('teldAdvancedSearch', function (Private, $compile, advancedSearch, courier) {

  return {
    restrict: 'E',
    // template: conditionTemplate,/** 不能使用这种方式 */
    scope: {
      state: '=',
      indexPattern: '=',
      boolSource: '=',
      boolSourceType: '=',
      boolSourceParent: '='
    },
    controller: function ($scope) {


      let fieldSource = $scope.fieldSource = advancedSearch.getFieldSource($scope.indexPattern);


      /**初始化选择值 */
      $scope.initSelectField = function () {
        advancedSearch.queryField2ViewModel(this.condition, fieldSource);
      }

      $scope.disableChange = function(){
        this.condition.selected.disabled=!this.condition.selected.disabled
        $scope.$emit('advancedSearch.condition.disable', {});
      }

      $scope.dateToTime = function () {
        if (_.isDate(this.condition.selected.value)) {
          this.condition.selected.value = parseInt(moment(this.condition.selected.value).format('x'));
        }
      }

      $scope.copyCondition = function () {
        if (this.condition.selected) {
          let copy = { field: this.condition.selected.field, operator: this.condition.selected.operator };
          copy.value = null;
          this.conditions.push({ selected: copy });
        }
      }

      /**删除条件 */
      $scope.remove = function () {
        _.pull(this.conditions, this.condition);
        if (this.conditions.length == 0) {
          delete this.conditions;
        }

        if (_.isEmpty($scope.boolSource[this.key])) {
          delete $scope.boolSource[this.key];
        }

        let size = 0;
        _.keys($scope.boolSource).forEach(key => {
          let length = $scope.boolSource[key].length;
          size += length;
        });

        if (size == 0 && $scope.boolSourceType) {
          _.pull($scope.boolSourceType, $scope.boolSourceParent);
        }
      }

      $scope.removeGroup = function () {
        _.pull($scope.boolSourceType, $scope.boolSourceParent);
        delete $scope.boolSource;
      }

      /**条件组 */
      $scope.addConditionGroup = function (type) {
        $scope.boolSource = $scope.boolSource || {};
        let conditions = $scope.boolSource[type] || ($scope.boolSource[type] = []);
        let bool = {};
        bool[type] = [{}];

        conditions.push({ "bool": {} });
      }

      $scope.addConditionGroupAndItem = function (type, conditionType) {
        $scope.boolSource = $scope.boolSource || {};
        let conditions = $scope.boolSource[type] || ($scope.boolSource[type] = []);
        let bool = {};
        bool[conditionType || type] = [{}];

        conditions.push({ "bool": bool });
      }

      $scope.addMustGroup = function () {
        $scope.addConditionGroup("must");
      }

      $scope.addMustNotGroup = function () {
        $scope.addConditionGroup("must_not");
      }

      /**条件组 */
      $scope.addShouldGroup = function () {

        $scope.addConditionGroup("should");
      }

      $scope.addMustGroupShould = function () {
        $scope.addConditionGroupAndItem("must", 'should');
      }

      /**单条件 */
      $scope.addCondition = function (type) {

        // if (_.isEmpty($scope.boolSource)) {
        //   //$scope.boolSource = { must: [], should: [], must_not: [] };
        //   $scope.boolSource.must = [];
        //   $scope.boolSource.should = [];
        //   $scope.boolSource.must_not = [];
        // }
        let conditions = $scope.boolSource[type] || ($scope.boolSource[type] = []);

        conditions.push({});

        $scope.$emit('advancedSearch.add', type);
      }
      /**AND */
      $scope.addMust = function () {

        $scope.addCondition('must');
        // let must = $scope.boolSource.must || ($scope.boolSource.must = []);

        // must.push({
        //   "term": {
        //     "CreateTime": {
        //       "value": "20170117174521446+08:00"
        //     }
        //   }
        // });
      }
      /**OR */
      $scope.addShould = function () {
        $scope.addCondition('should');
      }

      $scope.addMustNot = function () {
        $scope.addCondition('must_not');
      }

      $scope.filterOperator = function () {
        let returnValue = [];
        if (this.condition.selected) {
          returnValue = advancedSearch.filterOperator(this.condition.selected.field);
        }
        return returnValue;
      }

      $scope.fieldChange = function () {
        this.condition.selected.operator = advancedSearch.filterOperator(this.condition.selected.field)[0];
        this.condition.selected.value = this.condition.selected.field.type == 'number' ? 0 : '';
      }
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
.directive('teldAdvancedSearchDisplay', function (Private, $compile, advancedSearch) {

  return {
    restrict: 'E',
    // template: conditionTemplate,/** 不能使用这种方式 */
    scope: {
      state: '=',
      indexPattern: '=',
      boolSource: '=',
    },
    controller: function ($scope) {
      let fieldSource = $scope.fieldSource = advancedSearch.getFieldSource($scope.indexPattern);

      /**初始化选择值 */
      $scope.initSelectField = function () {
        advancedSearch.queryField2ViewModel(this.condition, fieldSource);
      }

      $scope.keySort = {};

      $scope.disableChange = function () {
        this.condition.selected.disabled = !this.condition.selected.disabled
        $scope.$emit('advancedSearch.condition.disable', {});
      }

      /**删除条件 */
      $scope.remove = function () {
        _.pull(this.conditions, this.condition);
        if (this.conditions.length == 0) {
          delete this.conditions;
        }

        if (_.isEmpty($scope.boolSource[this.key])) {
          delete $scope.boolSource[this.key];
        }

        let size = 0;
        _.keys($scope.boolSource).forEach(key => {
          let length = $scope.boolSource[key].length;
          size += length;
        });

        if (size == 0 && $scope.boolSourceType) {
          _.pull($scope.boolSourceType, $scope.boolSourceParent);
        }
      }
    },
    link: function ($scope, element) {
      const init = function () {
        //var template = conditionTemplate.template;
        var template = conditionDisplayTemplate;
        element.html('').append($compile(template)($scope));
      };

      // Start the directive
      init();
    }
  };
})
