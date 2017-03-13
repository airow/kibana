import _ from 'lodash';
import $ from 'jquery';
//import conditionTemplate from './condition_template';
import conditionTemplate from './condition.html';
import uiModules from 'ui/modules';

uiModules
.get('apps/discover')
.directive('discoverCondition', function (Private, $compile) {

  function term(input) {
    let returnValue = undefined;
    console.log(input);
    if ('term' in input) {
      _.forEach(input['term'], function (operator, field) {
        _.forEach(operator, function (value, op) {
          returnValue = {
            "name": field,
            "op": op,
            "value": value
          };
        });
      });
    }
    console.log(returnValue);
    return returnValue;
  }

  function separateBool(bool, key) {
    let original = bool[key] || [];

    let returnValue = {};
    returnValue[key] = [];

    original.forEach(function (element) {
      if ("bool" in element) {
        let subMust = separateBool(element.bool, "must");
        let subShould = separateBool(element.bool, "should");
        returnValue.bool = { "must": subMust, "should": subShould };
      } else {
        element.fieldInfo = term(element);
        returnValue[key].push(element);
      }
    });

    return returnValue;
  }  

  return {
    restrict: 'E',
    // template: conditionTemplate,/** 不能使用这种方式 */
    scope: {
      state: '=',
      indexPattern: '=',
      boolSource: '='
    },
    controller: function ($scope) {
      $scope.dict = {};

      let opMapping = {
        "string": [
          { display: "等于", value: "term" }, { display: "包含", value: "macth" }
        ],
        "number": [
          { display: "=", key: "term", value: "value" },
          { display: ">", key: "range", value: "gt" },
          { display: ">=", key: "range", value: "gte" },
          { display: "<", key: "range", value: "lt" },
          { display: "<=", key: "range", value: "lte" }
        ],
        "date": [
          { display: "=", key: "term", value: "value" },
          { display: ">", key: "range", value: "gt" },
          { display: ">=", key: "range", value: "gte" },
          { display: "<", key: "range", value: "lt" },
          { display: "<=", key: "range", value: "lte" }
        ]
      };

      function getOpMapping(type) {
        return opMapping[type];
      }      

      $scope.fieldSourceDict = {};

      let fieldSource = $scope.fieldSource = $scope.indexPattern.fields
        .filter(field => { return field.searchable && !field.analyzed; })
        .map(field => {

          let operatorArray = getOpMapping(field.type);

          let returnValue = $scope.fieldSourceDict[field.name] = { meta: field, operatorArray: operatorArray };

          return returnValue;
        });

      $scope.boolSource.must.must.forEach(item => {
        if (item.fieldInfo) {
          let fieldMeta = item.fieldMeta = $scope.fieldSourceDict[item.fieldInfo.name];

          if (item.fieldInfo.operator) {

            item.operator = fieldMeta
              .operatorArray.find(opItem => {
                return opItem.key === item.fieldInfo.key && opItem.value === item.fieldInfo.operator;
              });
          }
        }
      });

      $scope.$watch('x.fieldMeta', function (newValue, oldValue) {
        let i = 0;
      });

      $scope.onch = function(e){
        console.log($scope);
        this.x.fieldInfo.name = this.x.fieldMeta.meta.name;
      };

      // $scope.$watchMulti([
      //   'x.fieldMeta',
      //   'x.operator'
      // ], function () {
      //   let i = 0;
      //   // $scope.x.fieldInfo.name = x.fieldMeta.name;
      //   // $scope.x.fieldInfo.key = $scope.x.operator.key;
      //   // $scope.x.fieldInfo.operator = $scope.x.operator.value;
      // });

      /**删除条件 */
      $scope.remove = function (key) {
        _.pull(this.boolSource[key][key], this.x);this.hasSub = this.boolSource.must.must.length + this.boolSource.should.should.length > 0;
      }

      $scope.hasSub = function (key) {

        let returnValue = false;

        let subBool = $scope.boolSource[key].bool;

        if (subBool) {
          
          let submust_length = (subBool.must && subBool.must.must) ? subBool.must.must.length : 0;
          let subshould_length = (subBool.should && subBool.should.should) ? subBool.should.should.length : 0;

          returnValue = subshould_length + submust_length > 0;
        }

        return returnValue;
      }

      /**条件组 */
      $scope.addMustGroup = function () {

        let bool = $scope.boolSource.must.bool || ($scope.boolSource.must.bool = { "must": { "must": [] } });

        bool.must.must.push({
          "fieldInfo": { "name": "", "op": "", "value": "" }
        });
      }

      /**条件组 */
      $scope.addShouldGroup = function () {

        let bool = $scope.boolSource.should.bool || ($scope.boolSource.should.bool = { "should": { "should": [] } });

        bool.should.must.push({
          "fieldInfo": { "name": "", "op": "", "value": "" }
        });
      }

      
      $scope.addGroup = function (key) {

        let bool = $scope.boolSource[key].bool || ($scope.boolSource[key].bool = {}[key][key] = []);

        bool[key][key].push({
          "fieldInfo": { "name": "", "op": "", "value": "" }
        });
      }

      /**单条件 */
      $scope.addMust = function () {

        let must = $scope.boolSource.must || ($scope.boolSource.must = { "must": { "must": [] } });

        must.must.push({
          "term": {
            "CreateTime": {
              "value": "20170117174521446+08:00"
            }
          },
          "fieldInfo": { "name": "", "op": "", "value": "" }
        });
      }

      /**单条件 */
      $scope.addShould = function () { 

        let should = $scope.boolSource.should || ($scope.boolSource.should = {"should":{"should":[]}})

        should.should.push({
          "term": {
            "CreateTime": {
              "value": "20170117174521446+08:00"
            },
            "fieldInfo": { "name": "", "op": "", "value": "" }
          }
        });
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