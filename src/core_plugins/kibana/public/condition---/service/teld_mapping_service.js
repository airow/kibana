import _ from 'lodash';
import rison from 'rison-node';/*用于解析地址栏_a参数获取当前索引的Id*/
import Scanner from 'ui/utils/scanner';
import 'ui/notify';
import uiModules from 'ui/modules';


const module = uiModules.get('apps/discover');

// Register this service with the saved object registry so it can be
// edited by the object editor.
require('plugins/kibana/condition/service/teld_service_registry').register({
  service: 'teldMappingService',
  title: 'mappingService'
});

module.service('teldMappingService', function (Promise, config, kbnIndex, es, kbnUrl,$location) {
  const scanner = new Scanner(es, {
    index: kbnIndex,
    type: 'search'
  });

  this.type = SavedSearch.type;
  this.Class = SavedSearch;

  this.loaderProperties = {
    name: 'searches',
    // noun: 'Saved Search',
    // nouns: 'saved searches'
    noun: '保存的查询',
    nouns: '保存的查询'
  };


  this.scanAll = function (queryString, pageSize = 1000) {
    return scanner.scanAndMap(queryString, {
      pageSize,
      docCount: Infinity
    }, (hit) => this.mapHits(hit));
  };


  this.get = function (id) {
    return (new SavedSearch(id)).init();
  };
});
