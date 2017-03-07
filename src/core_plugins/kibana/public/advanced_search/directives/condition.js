import _ from 'lodash';
import $ from 'jquery';
import conditionTemplate from './condition.html';
import uiModules from 'ui/modules';

uiModules
.get('apps/advanced_search')
.directive('teldAdvancedSearch', function (Private, $compile) { 

  return {
    restrict: 'E',
    // template: conditionTemplate,/** 不能使用这种方式 */
    scope: {
      state: '=',
      indexPattern: '=',
      boolSource: '=',
      boolSourceType: '=',
      boolSourceParent: '=',
    },
    controller: function ($scope) {

      let fieldSource = $scope.fieldSource = $scope.indexPattern.fields
        .filter(field => { return field.searchable && field.analyzed == false; })
        .map(field => {
          debugger;
          field.asFieldName = field.name;
          //对字符穿类型进行特殊处理 =，like
          if (field.type === "string") {
            field.hasKeyword = _.endsWith(field.name, '.keyword');
            if (field.hasKeyword) {
              field.asFieldName = field.name.replace('.keyword', '');
            }
          }
          return field;
        });

      /**删除条件 */
      $scope.remove = function () {
        _.pull(this.conditions, this.condition);
        if (this.conditions.length == 0) {
          delete this.conditions;
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

      $scope.fieldChange = function () {
        //ithis.condition.selected.op
      }

      function queryField2ViewModel(condition) {

        let selected;

        ['match', 'range', 'term'].forEach(keyword => {
          let keys = _.keys(condition[keyword]);
          let fieldName = keys[0];
          if (fieldName) {
            let link = _.keys(condition[keyword][fieldName])[0];
            let selectValue = condition[keyword][fieldName][link];

            let selectField = fieldSource.find(field => { return field.name === fieldName });
            let selectOperator = selectField.typeOperators.find(operator => {
              return operator.keyword === keyword && operator.link === link;
            });
            selected = { value: selectValue, field: selectField, operator: selectOperator };
          }
        });

        return selected;
      }

      $scope.initSelectField = function () {
        this.condition.selected = queryField2ViewModel(this.condition);
      }

      /**初始化选择值 */
      $scope.initSelectField2 = function () {

        let that = this;
        //that.condition.selected = { value: null, field: null, operator: null };

        ['match', 'range'].forEach(keyword => {
          let keys = _.keys(that.condition[keyword]);
          let fieldName = keys[0];
          if (fieldName) {
            let link = _.keys(that.condition[keyword][fieldName])[0];
            let selectValue = that.condition[keyword][fieldName][link];

            let selectField = fieldSource.find(field => { return field.name === fieldName });
            let selectOperator = selectField.typeOperators.find(operator => {
              return operator.keyword === keyword && operator.link === link;
            });

            that.condition.selected = { value: selectValue, field: selectField, operator: selectOperator };

            // that.condition.selected.value = selectValue;
            // that.condition.selected.field = selectField;
            // that.condition.selected.operator = selectOperator;
          }
        });
        //this.condition.SelectField = indexPattern.fields.
      }

      /**条件组 */
      $scope.addConditionGroup = function (type) {     
        $scope.boolSource = $scope.boolSource || {};
        let conditions = $scope.boolSource[type] || ($scope.boolSource[type] = []);
        let bool = {};
        bool[type] = [{}];

        conditions.push({ "bool": bool });
      }

      $scope.addMustGroup = function () {
        $scope.addConditionGroup("must");
      }

      /**条件组 */
      $scope.addShouldGroup = function () {

        $scope.addConditionGroup("should");
      }

      /**单条件 */
      $scope.addCondition = function (type) {
        $scope.boolSource = $scope.boolSource || {};
        let conditions = $scope.boolSource[type] || ($scope.boolSource[type] = []);

        conditions.push({});
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
});