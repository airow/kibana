import _ from 'lodash';
import angular from 'angular';
import uiModules from 'ui/modules';
const module = uiModules.get('apps/advanced_search');

// This is the only thing that gets injected into controllers
module.service('backendExportService', function ($http, kbnIndex) {
  this.url = '/ESExportSrv';

  this.export = function (index, queryJson) {

    //{'index':['etlentercustday'],'ignore_unavailable':true,'preference':1531379860780}
    //{'query':{'bool':{'must':[{'query_string':{'query':'*','analyze_wildcard':true,'allow_leading_wildcard':false}},{'bool':{}},{'range':{'充电日期':{'gte':1499844068846,'lte':1531380068846,'format':'epoch_millis'}}}],'must_not':[]}},'highlight':{'pre_tags':['@kibana-highlighted-field@'],'post_tags':['@/kibana-highlighted-field@'],'fields':{'*':{}},'require_field_match':false,'fragment_size':2147483647},'size':100,'sort':[{'充电日期':{'order':'desc','unmapped_type':'boolean'}}],'_source':{'excludes':[]},'aggs':{'2':{'date_histogram':{'field':'充电日期','interval':'1w','time_zone':'Asia/Shanghai','min_doc_count':1}}},'stored_fields':['*'],'script_fields':{},'docvalue_fields':['充电日期']}

    let query = {
      'query': {
        'bool': {
          'must': [{
            'query_string': {
              'query': '*', 'analyze_wildcard': true,
              'allow_leading_wildcard': false
            }
          }, { 'bool': {} },
          { 'range': { '充电日期': { 'gte': 1499844068846, 'lte': 1531380068846, 'format': 'epoch_millis' } } }],
          'must_not': []
        }
      }, 'highlight': {
        'pre_tags': ['@kibana-highlighted-field@'],
        'post_tags': ['@/kibana-highlighted-field@'], 'fields': { '*': {} }, 'require_field_match': false,
        'fragment_size': 2147483647
      }, 'size': 100, 'sort': [{ '充电日期': { 'order': 'desc', 'unmapped_type': 'boolean' } }],
      '_source': { 'excludes': [] },
      'aggs': {
        '2': {
          'date_histogram': {
            'field': '充电日期', 'interval': '1w', 'time_zone': 'Asia/Shanghai',
            'min_doc_count': 1
          }
        }
      }, 'stored_fields': ['*'], 'script_fields': {}, 'docvalue_fields': ['充电日期']
    };

    return $http.post(this.url + '/export',
      {
        userId: 'userId',
        index: 'etlentercustday',
        queryJson: JSON.stringify(query)
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

  this.tasklist = function (index, queryJson) {
    return $http.get(this.url + '/tasklist').success(function (data, header, config, status) {
      //响应成功
      debugger;
      return data;
    }).error(function (data, header, config, status) {
      //处理响应失败
      debugger;
    });
  };
});
