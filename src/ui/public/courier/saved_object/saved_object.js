/**
 * @name SavedObject
 *
 * NOTE: SavedObject seems to track a reference to an object in ES,
 * and surface methods for CRUD functionality (save and delete). This seems
 * similar to how Backbone Models work.
 *
 * This class seems to interface with ES primarily through the es Angular
 * service and a DocSource instance.
 */

import angular from 'angular';
import _ from 'lodash';

import errors from 'ui/errors';
import slugifyId from 'ui/utils/slugify_id';
import MappingSetupProvider from 'ui/utils/mapping_setup';

import DocSourceProvider from '../data_source/doc_source';
import SearchSourceProvider from '../data_source/search_source';

export default function SavedObjectFactory(es, kbnIndex, Promise, Private, Notifier, safeConfirm, indexPatterns) {

  let DocSource = Private(DocSourceProvider);
  let SearchSource = Private(SearchSourceProvider);
  let mappingSetup = Private(MappingSetupProvider);

  function SavedObject(config) {
    if (!_.isObject(config)) config = {};

    // save an easy reference to this
    let self = this;

    /************
     * Initialize config vars
     ************/
    // the doc which is used to store this object
    let docSource = new DocSource();

    // type name for this object, used as the ES-type
    let type = config.type;

    // Create a notifier for sending alerts
    let notify = new Notifier({
      location: 'Saved ' + type
    });

    // mapping definition for the fields that this object will expose
    let mapping = mappingSetup.expandShorthand(config.mapping);

    // default field values, assigned when the source is loaded
    let defaults = config.defaults || {};

    let afterESResp = config.afterESResp || _.noop;
    let customInit = config.init || _.noop;

    // optional search source which this object configures
    self.searchSource = config.searchSource && new SearchSource();

    // the id of the document
    self.id = config.id || void 0;
    self.defaults = config.defaults;

    /**
     * Asynchronously initialize this object - will only run
     * once even if called multiple times.
     *
     * @return {Promise}
     * @resolved {SavedObject}
     */
    self.init = _.once(function () {
      // ensure that the type is defined
      if (!type) throw new Error('You must define a type name to use SavedObject objects.');

      // tell the docSource where to find the doc
      docSource
      .index(kbnIndex)
      .type(type)
      .id(self.id);

      // check that the mapping for this type is defined
      return mappingSetup.isDefined(type)
      .then(function (defined) {
        // if it is already defined skip this step
        if (defined) return true;

        mapping.kibanaSavedObjectMeta = {
          properties: {
            // setup the searchSource mapping, even if it is not used but this type yet
            searchSourceJSON: {
              type: 'string'
            }
          }
        };

        if (config.mappingProps) {
          for (let key in config.mappingProps) {
            mapping[key] = config.mappingProps[key];
          }
        }

        /** 定义ui配置相关参数,不定义使用动态方式设置 */
        // mapping.uiConf = {
        //   properties: {
        //     // setup the uiConf mapping, even if it is not used but this type yet
        //     showTimeDiagram: {
        //       type: 'keyword'
        //     },
        //     menus: {
        //       type: 'keyword'
        //     },
        //     pageSize: {
        //       type: 'keyword'
        //     },
        //     advancedSearchBool: {
        //       type: 'keyword'
        //     },
        //     navigation: {
        //       type: 'keyword'
        //     },
        //   }
        // };        

        // tell mappingSetup to set type
        return mappingSetup.setup(type, mapping);
      })
      .then(function () {
        // If there is not id, then there is no document to fetch from elasticsearch
        if (!self.id) {
          // just assign the defaults and be done
          _.assign(self, defaults);
          return hydrateIndexPattern().then(function () {
            return afterESResp.call(self);
          });
        }

        // fetch the object from ES
        return docSource.fetch()
        .then(self.applyESResp);
      })
      .then(function () {
        return customInit.call(self);
      })
      .then(function () {
        // return our obj as the result of init()
        return self;
      });
    });

    self.applyESResp = function (resp) {
      self._source = _.cloneDeep(resp._source);

      if (resp.found != null && !resp.found) throw new errors.SavedObjectNotFound(type, self.id);

      let meta = resp._source.kibanaSavedObjectMeta || {};
      delete resp._source.kibanaSavedObjectMeta;

      let uiConf = resp._source.uiConf || {};
      //delete resp._source.uiConf.advancedSearchBool;

      if (!config.indexPattern && self._source.indexPattern) {
        config.indexPattern = self._source.indexPattern;
        delete self._source.indexPattern;
      }

      // assign the defaults to the response
      _.defaults(self._source, defaults);

      // transform the source using _deserializers
      _.forOwn(mapping, function ittr(fieldMapping, fieldName) {
        if (fieldMapping._deserialize) {
          self._source[fieldName] = fieldMapping._deserialize(self._source[fieldName], resp, fieldName, fieldMapping);
        }
      });

      // Give obj all of the values in _source.fields
      _.assign(self, self._source);

      return Promise.try(function () {
        parseSearchSource(meta.searchSourceJSON);
        parseAdvancedSearchBool(uiConf.advancedSearchBool);
      })
      .then(hydrateIndexPattern)
      .then(function () {
        return Promise.cast(afterESResp.call(self, resp));
      })
      .then(function () {
        // Any time obj is updated, re-call applyESResp
        docSource.onUpdate().then(self.applyESResp, notify.fatal);
      });
    };

    function parseSearchSource(searchSourceJson) {
      if (!self.searchSource) return;

      // if we have a searchSource, set its state based on the searchSourceJSON field
      let state;
      try {
        state = JSON.parse(searchSourceJson);
      } catch (e) {
        state = {};
      }

      let oldState = self.searchSource.toJSON();
      let fnProps = _.transform(oldState, function (dynamic, val, name) {
        if (_.isFunction(val)) dynamic[name] = val;
      }, {});

      self.searchSource.set(_.defaults(state, fnProps));
    }

    function parseAdvancedSearchBool(advancedSearchBoolJson) {
      if (!self.uiConf || !self.uiConf.advancedSearchBool) return;

      // if we have a searchSource, set its state based on the advancedSearchBoolJson field
      let state;
      try {
        state = JSON.parse(advancedSearchBoolJson);
      } catch (e) {
        state = {};
      }

      self.uiConf.advancedSearchBool = state;
    }

    /**
     * After creation or fetching from ES, ensure that the searchSources index indexPattern
     * is an bonafide IndexPattern object.
     *
     * @return {[type]} [description]
     */
    function hydrateIndexPattern() {
      return Promise.try(function () {
        if (self.searchSource) {

          let index = config.indexPattern || self.searchSource.getOwn('index');
          if (!index) return;
          if (config.clearSavedIndexPattern) {
            self.searchSource.set('index', undefined);
            return;
          }

          if (!(index instanceof indexPatterns.IndexPattern)) {
            index = indexPatterns.get(index);
          }

          return Promise.resolve(index).then(function (indexPattern) {
            self.searchSource.set('index', indexPattern);
          });
        }
      });
    }

    /**
     * Serialize this object
     *
     * @return {Object}
     */
    self.serialize = function () {
      let body = {};

      _.forOwn(mapping, function (fieldMapping, fieldName) {
        if (self[fieldName] != null) {
          body[fieldName] = (fieldMapping._serialize)
            ? fieldMapping._serialize(self[fieldName])
            : self[fieldName];
        }
      });

      if (self.searchSource) {
        body.kibanaSavedObjectMeta = {
          searchSourceJSON: angular.toJson(_.omit(self.searchSource.toJSON(), ['sort', 'size', 'advancedSearch']))
        };
      }

      /** 关键代码，没有这句数据不会保存到ES中 */
      let extColumns = ["uiConf"];

      if (_.has(self, 'uiConf.advancedSearchBool')) {
        if(_.isObject(self.uiConf.advancedSearchBool))
        {
          self.uiConf.advancedSearchBool = angular.toJson(self.uiConf.advancedSearchBool);
        }
      }

      extColumns.forEach(function (value) {
        if (self[value]) {
          body[value] = self[value];
        }
      });
      
      return body;
    };

    /**
     * Save this object
     *
     * @return {Promise}
     * @resolved {String} - The id of the doc
     */
    self.save = function () {

      let body = self.serialize();

      // Slugify the object id
      self.id = slugifyId(self.id);

      // ensure that the docSource has the current self.id
      docSource.id(self.id);

      // index the document
      return self.saveSource(body);
    };

    self.saveSource = function (source) {
      let finish = function (id) {
        self.id = id;
        return es.indices.refresh({
          index: kbnIndex
        })
        .then(function () {
          return self.id;
        });
      };

      return docSource.doCreate(source)
      .then(finish)
      .catch(function (err) {
        // record exists, confirm overwriting
        if (_.get(err, 'origError.status') === 409) {
          let confirmMessage = 'Are you sure you want to overwrite ' + self.title + '?';

          return safeConfirm(confirmMessage).then(
            function () {
              return docSource.doIndex(source).then(finish);
            },
            _.noop // if the user doesn't overwrite record, just swallow the error
          );
        }
        return Promise.reject(err);
      });
    };

    /**
     * Destroy this object
     *
     * @return {undefined}
     */
    self.destroy = function () {
      docSource.cancelQueued();
      if (self.searchSource) {
        self.searchSource.cancelQueued();
      }
    };

    /**
     * Delete this object from Elasticsearch
     * @return {promise}
     */
    self.delete = function () {
      return es.delete({
        index: kbnIndex,
        type: type,
        id: this.id
      }).then(function () {
        return es.indices.refresh({
          index: kbnIndex
        });
      });
    };
  }

  return SavedObject;
};
