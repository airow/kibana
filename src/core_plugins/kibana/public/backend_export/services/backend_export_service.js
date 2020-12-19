import _ from 'lodash';
import angular from 'angular';
import uiModules from 'ui/modules';
const module = uiModules.get('apps/advanced_search');

// This is the only thing that gets injected into controllers
module.service('backendExportService', function ($http, kbnIndex) {
  this.url = '/ESExportSrv';

  this.export = function (savedObject, flatSource) {


    // var columns = _.filter(flatSource.index.fields, function (f) { return _.includes(savedObject.columns, f.displayName); });
    // columns = _.map(columns, function (f) { return { field: f.name, display: f.displayName }; });

    // var columnMap = [_.size(savedObject.columns)];
    // _.forEach(columns, function (col) {
    //   columnMap[_.indexOf(savedObject.columns, col.display)] = col;
    // });

    //flatSource.body._source = savedObject.columns;
    var ip = savedObject.searchSource.get('index');
    var timeFieldName = ip.timeFieldName;
    var docvalue = [];
    if (false === _.isUndefined(timeFieldName)) {
      docvalue.push(timeFieldName);
    }
    
    flatSource.body._source = [].concat(docvalue, savedObject.columns);
    flatSource.body._source = _.uniq(flatSource.body._source);   
    
    let obj = {
      userId: 'userId',
      index: flatSource.index.id,
      queryJson: JSON.stringify(flatSource.body)
    };

    const aliasFields = _.filter(ip.fields, 'alias');
    if (_.size(aliasFields) > 0) {
      const aliasMapping = _.transform(aliasFields, (result, value) => {
        return result[value.displayName] = value.alias
      }, {});
      if (_.isEmpty(aliasMapping) === false) {
        obj.alias = JSON.stringify(aliasMapping);
      }
    }

    return $http.post(this.url + '/export',
      obj,
      {
        transformRequest: function (obj) {
          var str = [];
          for (var p in obj) {
            str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
          }
          return str.join('&');
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }).success(function (data, header, config, status) {
        debugger;
        return data;
      }).error(function (data, header, config, status) {
        //处理响应失败
        debugger;
      });
  };

  this.tasklist = function (esIndex, pageIndex, pageSize, hideCancelTask) {
    return $http.get(this.url + '/tasklist?index=' + esIndex).success(function (data, header, config, status) {
      //响应成功
      debugger;
      //data.data = _.take(data.data, pageSize);

      if (hideCancelTask) {
        data.data = _.filter(data.data, item => { return item.CancelFlag != 1; });
      }
      data.dataTotls = _.size(data.data);
      data.totalPageNum = Math.ceil(data.dataTotls / pageSize);
      data.data = _.filter(data.data, (value, index) => {
        return index >= pageIndex * pageSize && index <= pageIndex * pageSize + pageSize - 1;
      });

      return data;
    }).error(function (data, header, config, status) {
      //处理响应失败
      debugger;
    });
  };

  this.cancelTask = function (taskId) {
    return $http.post(this.url + '/cancelTask',
      {
        taskId: taskId
      },
      {
        transformRequest: function (obj) {
          var str = [];
          for (var p in obj) {
            str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
          }
          return str.join('&');
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }).success(function (data, header, config, status) {
        debugger;
        return data;
      }).error(function (data, header, config, status) {
        //处理响应失败
        debugger;
      });
  };
});
