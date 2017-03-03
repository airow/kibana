export default {
  template: `
          <!-- -->
          <div class="btn-group" role="group" aria-label="...">
            <button onclick='this.blur();' style="cursor: default; background-color: cornflowerblue;" class="btn btn-primary btn-xs glyphicon">与</button>
            <button type="button" ng-click="addMust()" class="btn btn-primary btn-xs glyphicon glyphicon-plus">条件</button>
            <button type="button" ng-click="addMustGroup()" class="btn btn-primary btn-xs glyphicon glyphicon-tasks">分组</button>
          </div>
          <div class="btn-group btn-group-xs" role="group" aria-label="...">
            <button onclick='this.blur();' style="cursor: default; background-color: yellowgreen;" class="btn btn-primary btn-xs glyphicon">或</button>
            <button type="button" ng-click="addShould()"  class="btn btn-primary btn-xs glyphicon glyphicon-plus">条件</button>
            <button type="button" ng-click="addShouldGroup()" class="btn btn-primary btn-xs glyphicon glyphicon-tasks">分组</button>
          </div> 
          <table class="table adv">
            <!--must-->
            <tbody data-bool='must'>
              <!--
              <tr>
                <td colspan="5">
                  与
                  <button type="button" ng-click="addMust()" class="btn btn-primary btn-xs glyphicon glyphicon-plus">条件</button>
                  <button type="button" ng-click="addMustGroup()" class="btn btn-primary btn-xs glyphicon glyphicon-plus">分组</button>
                </td>
              </tr>
              -->
              <tr ng-repeat="x in boolSource.must.must">
                <td>
                  <div class="row">
                    <div class="col-xs-1">
                      <button type="button" class="btn btn-danger btn-xs glyphicon glyphicon-remove" ng-click='remove("must")'></button>
                      </div>
                    <div class="col-xs-11">
                      <select class="form-control" ng-model="x.fieldMeta" ng-options="fieldSourceItem.meta.name for fieldSourceItem in fieldSourceDict">
                        <option></option>
                      </select>                      
                    </div>
                  </div>                  
                </td>
                <td>                  
                  <select class="form-control" ng-change='x.fieldInfo.name = x.fieldMeta.meta.name;' ng-model="x.operator" ng-options="operatorItem.display for operatorItem in x.fieldMeta.operatorArray">
                    <option></option>
                  </select>
                </td>
                <td>
                  <input type="text" class="form-control" ng-model="x.fieldInfo.value"/>
                </td>                
              </tr>
              <tr>
                <td colspan="4" data-bool="bool" ng-if='boolSource.must.bool'>
                  
                </td>
              </tr>
            </tbody>
          </table>                   
          <table class="table adv">
            <!--should-->
            <tbody data-bool='should'>
              <!--
              <tr>
                <td colspan="5">
                  或
                  <button type="button" ng-click="addShould()"  class="btn btn-primary btn-xs glyphicon glyphicon-plus">条件</button>
                  <button type="button" ng-click="addShouldGroup()" class="btn btn-primary btn-xs glyphicon glyphicon-plus">分组</button>
                </td>
              </tr>
              -->
              <tr ng-repeat="x in boolSource.should.should">
                <td>
                  <div class="row">
                    <div class="col-xs-1">
                      <button type="button" class="btn btn-danger btn-xs glyphicon glyphicon-remove" ng-click='remove("should")'></button>
                    </div>
                    <div class="col-xs-11">
                      <select class="form-control" ng-model="x.fieldInfo.name"  ng-options="field for field in fieldSource">
                        <option></option>
                      </select>
                    </div>
                  </div>
                </td>
                <td>
                  <select class="form-control" ng-model="x.fieldInfo.op"  ng-options="field for field in x.operatorList">
                    <option></option>
                  </select>
                </td>
                <td>
                  <input type="text" class="form-control" ng-model='x.fieldInfo.value' />
                </td>               
              </tr>
              <tr ng-if='boolSource.should.bool'>
                <td colspan="4" data-bool="bool">
                  
                </td>
              </tr>
          </table>`
};