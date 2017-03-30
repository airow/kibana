import _ from 'lodash';
import rison from 'rison-node';/*用于解析地址栏_a参数获取当前索引的Id*/
import Scanner from 'ui/utils/scanner';
import 'plugins/kibana/navigation/navigation_confs/_navigation_conf';
import 'ui/notify';
import uiModules from 'ui/modules';

import 'plugins/kibana/advanced_search/state/teld_state';


const module = uiModules.get('discover/saved_searches', [
  'kibana/notify'
]);

// Register this service with the saved object registry so it can be
// edited by the object editor.
require('plugins/kibana/management/saved_object_registry').register({
  service: 'navigationConfs',
  title: 'navigationConf'
});

 module.service('navigationConfs', function (Promise, config, kbnIndex, es, createNotifier, NavigationConf, kbnUrl, teldSession) {
  const scanner = new Scanner(es, {
    index: kbnIndex,
    type: 'navigationConf'
  });

  const notify = createNotifier({
    location: 'Saved NavigationConf'
  });

  this.type = NavigationConf.type;
  this.Class = NavigationConf;

  this.loaderProperties = {
    name: 'NavigationConf',
    // noun: 'Saved Search',
    // nouns: 'saved searches'
    noun: 'NavigationConf',
    nouns: 'NavigationConf'
  };


  this.scanAll = function (queryString, pageSize = 1000) {
    return scanner.scanAndMap(queryString, {
      pageSize,
      docCount: Infinity
    }, (hit) => this.mapHits(hit));
  };


  this.get = function (id) {
    return (new NavigationConf(id)).init();
  };

  this.urlFor = function (id) {
    return kbnUrl.eval('#/navigationConf/{{id}}', {id: id});
  };

  this.delete = function (ids) {
    ids = !_.isArray(ids) ? [ids] : ids;
    return Promise.map(ids, function (id) {
      return (new NavigationConf(id)).delete();
    });
  };

  this.mapHits = function (hit) {
    const source = hit._source;
    source.id = hit._id;
    //source.url = this.urlFor(hit._id);
    source.title = source.id;
    return source;
  };

  this.find = function (searchString, size = 100) {
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
      type: this.type,
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
});
