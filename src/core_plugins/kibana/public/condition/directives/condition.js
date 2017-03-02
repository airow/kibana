import _ from 'lodash';
import $ from 'jquery';
import conditionTemplate from './condition.html';
//import template from './tree.html';
import uiModules from 'ui/modules';

uiModules
.get('apps/discover')
.directive('discoverCondition', function (Private, $compile) {
  return {
    restrict: 'E',
    // template: conditionTemplate,/** 不能使用这种方式 */
    scope : {
      boolSource: '=',
      fieldSource: '='
    },
    controller: function ($scope) {

      $scope.remove = function (key) {
        _.pull(this.boolSource[key][key], this.x);
      }

      $scope.addMustGroup = function () {

        let bool = this.boolSource.must.bool || (this.boolSource.must.bool = { "must": { "must": [] } });

        bool.must.must.push({
          "ter22m": {
            "CreateTime": {
              "value": "20170117174521446+08:00"
            }
          }
        });
      }

      $scope.addShouldGroup = function () {

        let bool = this.boolSource.should.bool || (this.boolSource.should.bool = { "should": { "should": [] } });

        bool.should.must.push({
          "ter22m": {
            "CreateTime": {
              "value": "20170117174521446+08:00"
            }
          }
        });
      }

      $scope.addGroup = function (key) {

        let bool = this.boolSource[key].bool || (this.boolSource[key].bool = {}[key][key] = []);

        bool[key][key].push({
          "ter22m": {
            "CreateTime": {
              "value": "20170117174521446+08:00"
            }
          }
        });
      }

      $scope.addMust = function () { 
        $scope.boolSource.must.must.push({
          "term": {
            "CreateTime": {
              "value": "20170117174521446+08:00"
            }
          }
        });
      }
      $scope.fieldChange = function () {

        let mapping = {
          "字段1": [1, 2, 3, 4, 5],
          "字段2": [10, 20, 30, 40, 50],
          "字段3": [100, 200, 300, 400, 500],
          "字段4": [20000, 'gle', 40000, 50000,'value'],
          "字段5": [1000000, 2000000, 3000000, 4000000, 5000000]
        }

        operatorList = mapping[this.x.fieldInfo.name];

      }

      $scope.operatorList = [100, 200, 300, 400, 500];

      $scope.operator = function(){
        //alert(this.x);
        //console.log(this.selectedField);

        let mapping = {
          "字段1": [1, 2, 3, 4, 5],
          "字段2": [10, 20, 30, 40, 50],
          "字段3": [100, 200, 300, 400, 500],
          "字段4": [20000, 'gle', 40000, 50000,'value'],
          "字段5": [1000000, 2000000, 3000000, 4000000, 5000000]
        }

        return mapping[this.x.fieldInfo.name];
      }

      $scope.addShould = function () { 
        $scope.boolSource.should.should.push({
          "term": {
            "CreateTime": {
              "value": "20170117174521446+08:00"
            }
          }
        });
      }
    },
    link: function ($scope, element) {
      const init = function () {
        var template = `
          <table class="table adv">
            <!--must-->
            <tbody data-bool='must'>
              <tr>
                <td colspan="5">
                  与
                  <button type="button" ng-click="addMust()" class="btn btn-primary btn-xs glyphicon glyphicon-plus">条件</button>
                  <button type="button" ng-click="addMustGroup()" class="btn btn-primary btn-xs glyphicon glyphicon-plus">分组</button>
                </td>
              </tr>
              <tr ng-repeat="x in boolSource.must.must">
                <td>
                  <select class="form-control" ng-model="name"  ng-options="field for field in fieldSource">
                    <option></option>
                  </select>
                </td>
                <td>           
                {{x.fieldInfo}}     
                  <select class="form-control" ng-options="value in operator">
                    <option></option>
                  </select>
                </td>
                <td>
                  <input type="text" class="form-control" />
                </td>
                <td>
                  <button type="button" class="glyphicon glyphicon-remove" ng-click='remove("must")'></button>
                </td>
              </tr>
              <tr>
                <td colspan="5" data-bool="bool" ng-if='boolSource.must.bool'>
                  <discover-condition bool-source="boolSource.must.bool" field-source='fieldSource'></discover-condition>
                </td>
              </tr>
            </tbody>
            <!--should-->
            <tbody data-bool='should'>
              <tr>
                <td colspan="5">
                  或
                  <button type="button" ng-click="addShould()"  class="btn btn-primary btn-xs glyphicon glyphicon-plus">条件</button>
                  <button type="button" ng-click="addShouldGroup()" class="btn btn-primary btn-xs glyphicon glyphicon-plus">分组</button>
                </td>
              </tr>
              <tr ng-repeat="x in boolSource.should.should">
                <td>
                  <select class="form-control" ng-change='fieldChange' ng-model="x.fieldInfo.name"  ng-options="field for field in fieldSource">
                    <option></option>
                  </select>
                </td>
                <td>
                {{x.operatorList}}
                  <select class="form-control" ng-model="x.fieldInfo.op"  ng-options="field for field in x.operatorList">
                    <option></option>
                  </select>
                </td>
                <td>
                  <input type="text" class="form-control" ng-model='x.fieldInfo.value' />
                </td>
                <td>
                  <button type="button" class="glyphicon glyphicon-remove" ng-click='remove("should")'></button>
                </td>
              </tr>
              <tr ng-if='boolSource.should.bool'>
                <td colspan="5" data-bool="bool">
                  <discover-condition bool-source="boolSource.should.bool" field-source='fieldSource'></discover-condition>                
                </td>
              </tr>
          </table>`;

        element.html('').append($compile(template)($scope));
      };

      // Start the directive
      init();
    }
  };
});