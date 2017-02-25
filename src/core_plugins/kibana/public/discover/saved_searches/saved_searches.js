import _ from 'lodash';
import rison from 'rison-node';/*用于解析地址栏_a参数获取当前索引的Id*/
import Scanner from 'ui/utils/scanner';
import 'plugins/kibana/discover/saved_searches/_saved_search';
import 'ui/notify';
import uiModules from 'ui/modules';


const module = uiModules.get('discover/saved_searches', [
  'kibana/notify'
]);

// Register this service with the saved object registry so it can be
// edited by the object editor.
require('plugins/kibana/management/saved_object_registry').register({
  service: 'savedSearches',
  title: 'searches'
});

module.service('savedSearches', function (Promise, config, kbnIndex, es, createNotifier, SavedSearch, kbnUrl,$location) {
  const scanner = new Scanner(es, {
    index: kbnIndex,
    type: 'search'
  });

  const notify = createNotifier({
    location: 'Saved Searches'
  });

  this.type = SavedSearch.type;
  this.Class = SavedSearch;

  this.loaderProperties = {
    name: 'searches',
    noun: 'Saved Search',
    nouns: 'saved searches'
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

  this.urlFor = function (id) {
    return kbnUrl.eval('#/discover/{{id}}', {id: id});
  };

  this.delete = function (ids) {
    ids = !_.isArray(ids) ? [ids] : ids;
    return Promise.map(ids, function (id) {
      return (new SavedSearch(id)).delete();
    });
  };

  this.mapHits = function (hit) {
    const source = hit._source;
    source.id = hit._id;
    source.url = this.urlFor(hit._id);
    return source;
  };

  /** 原始方式 */
  this.findOriginal = function (searchString, size = 100) {
    let body;
    if (searchString) {
      body = {
        query: {
          simple_query_string: {
            query: searchString + '*',
            fields: ['title^3', 'description'],
            default_operator: 'AND'
          }
        }
      };
    } else {
      body = { query: { match_all: {} } };
    }

    return es.search({
      index: kbnIndex,
      type: 'search',
      body: body,
      size: size
    })
      .then((resp) => {
        return {
          total: resp.hits.total,
          hits: resp.hits.hits.map((hit) => this.mapHits(hit))
        };
      });
  };

  /** discover 界面 open 操作使用 */
  this.findBy = function (searchAJson, searchString, size = 100) {
    let tagetIndex = searchAJson.index;

    let body;
    if (searchString) {
      body = {
        query: {
          bool: {
            must: [
            //   {
            //   term: {
            //     tagetIndex
            //   }
            // }, 
              {
                query_string: {
                  //query: "tagetIndex: \""+tagetIndex+"\"",
                  //query: "kibanaSavedObjectMeta.searchSourceJSON:\"{\"index\":\""+tagetIndex+"\""
                  //query: "kibanaSavedObjectMeta.searchSourceJSON:\"" + tagetIndex + "\""
                  //query: "kibanaSavedObjectMeta.searchSourceJSON:\"{\\\"index\\\":\\\"系统运行日志\\\"\""
                  query: "kibanaSavedObjectMeta.searchSourceJSON:\"{\\\"index\\\":\\\""+tagetIndex+"\\\"\""
                }
              },
            {
              simple_query_string: {
                query: searchString + '*',
                fields: ['title^3', 'description'],
                default_operator: 'AND'
              }
            }]
          }
        }
      };
    } else {
      //body = {query: {match: {tagetIndex}}};
      body = {
        query: {
          query_string: {
            //query: "tagetIndex: \"" + tagetIndex + "\""
            //query: "kibanaSavedObjectMeta.searchSourceJSON:\"{\"index\":\""+tagetIndex+"\""
            //query: "kibanaSavedObjectMeta.searchSourceJSON:\"" + tagetIndex + "\""
            //query: "kibanaSavedObjectMeta.searchSourceJSON:\"{\\\"index\\\":\\\"系统运行日志\\\"\""
            query: "kibanaSavedObjectMeta.searchSourceJSON:\"{\\\"index\\\":\\\""+tagetIndex+"\\\"\""
          }
        }
      };
    }

    return es.search({
      index: kbnIndex,
      type: 'search',
      body: body,
      size: size
    })
    .then((resp) => {
      return {
        total: resp.hits.total,
        hits: resp.hits.hits.map((hit) => this.mapHits(hit))
      };
    });
  }

  this.find = function (searchString, size = 100) {
    let search = $location.search();//获取地址栏查询参数angular $location 组件

    if (search["_a"]) {
      let searchAJson = rison.decode(search["_a"]); //使用rison解码地址栏参数
      if (searchAJson.index) {
        return this.findBy(searchAJson, searchString, size);
      } else {
        return this.findOriginal(searchString, size);
      }
    }
    else {
      return this.findOriginal(searchString, size);
    }
  };
});
