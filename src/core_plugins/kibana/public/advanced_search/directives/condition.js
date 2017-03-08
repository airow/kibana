import _ from 'lodash';
import $ from 'jquery';
import conditionTemplate from './condition.html';
import uiModules from 'ui/modules';

uiModules
.get('apps/advanced_search')
.directive('teldAdvancedSearch', function (Private, $compile, advancedSearch) { 

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
      
      
      /**初始化选择值 */
      $scope.initSelectField = function () {
        advancedSearch.queryField2ViewModel(this.condition, fieldSource);
      }      
      
      $scope.disableChange = function(){
        this.condition.selected.disabled=!this.condition.selected.disabled
        $scope.$emit('advancedSearch.condition.disable', {});  
      }

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

      $scope.addMustNot = function () {
        $scope.addCondition('must_not');
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