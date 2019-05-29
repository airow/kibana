import _ from 'lodash';
import docViewsRegistry from 'ui/registry/doc_views';

import editorHtml from './editor.html';

docViewsRegistry.register(function () {
  return {
    title: 'Editor',
    order: 10,
    skip: true,
    directive: {
      template: editorHtml,
      scope: {
        hit: '=',
        indexPattern: '=',
        filter: '=',
        columns: '=',
        savedObj: '='
      },
      controller: function ($scope, es, Notifier, $http) {
        const notify = new Notifier();
        $scope.mapping = $scope.indexPattern.fields.byName;
        $scope.flattened = $scope.hit._source;
        // $scope.flattened = $scope.indexPattern.flattenHit($scope.hit);
        $scope.originalFlattened = _.clone($scope.flattened);
        $scope.formatted = $scope.indexPattern.formatHit($scope.hit);
        $scope.fields = _.filter(_.keys($scope.flattened).sort(), field => { return _.startsWith(field, "_") === false; });
        var editorConf;
        var columnConf = _.get($scope.savedObj, 'uiConf.columnConf');
        if (columnConf) {
          editorConf = _.find(columnConf, { "fieldName": "_editor_" });
          var columnsName = _.map(editorConf.columns, 'name');
          $scope.editorConfByName = _.zipObject(columnsName, editorConf.columns);
          var columns = _.size(editorConf.columns) > 0 ? columnsName : [];
          if (_.size(columns) > 0) {
            $scope.fields = _.filter($scope.fields, function (f) { return _.includes(columns, f); });
            _.transform(_.filter(editorConf.columns, { type: "external" }), (result, value) => {
              result.push(value.name);
            }, $scope.fields);
          }
        }

        $scope.toggleColumn = function (fieldName) {
          _.toggleInOut($scope.columns, fieldName);
        };

        $scope.disabled = function () {
          var returnValue = true;
          _.each($scope.fields, function (field) {
            if ($scope.flattened[field] !== $scope.originalFlattened[field]) {
              returnValue = false;
              return false;
            }
          });
          return returnValue;
        };

        $scope.updateES = function (row, field) {

          var doc = _.transform($scope.flattened, (result, value, key) => {
            if (value !== $scope.originalFlattened[key]) {
              result[key] = value;
            }
          }, {});

          es.update({
            index: $scope.hit._index,
            type: $scope.hit._type,
            id: $scope.hit._id,
            refresh: true,
            fields: _.keys(doc),
            body: { doc }
          })
            .then(function (resp) {
              _.each(doc, (value, key) => {
                $scope.flattened[key] = value;
              });
              $scope.originalFlattened = _.clone($scope.flattened);

              $scope.$emit('editor-complete');

              return true;
            })
            .catch(notify.fatal);
        };

        function sghost(host, SID) {
          var protocol = window.location.protocol;
          var hostname = window.location.hostname;
          var domain = document.domain || hostname;
          var ares = domain.split(':')[0].split('.');
          ares.shift();
          ares.unshift("");
          domain = ares.join('.');
          //if (!/^\.teld\.(cn|net)+$/i.test(domain)) { domain += ':7777'; }//准生产加端口号
          if (!new RegExp("^\.(teld\.(cn|net)+|hfcdgs.com)$", "i").test(domain)) { domain += ':7777'; }//准生产加端口号
          return protocol + '//' + host + domain + '/api/invoke?SID=' + SID;
        }

        var strategyFun = {
          _genSgData: function (doc) {

            var query = {
              "refId": "TSG",
              "format": "table",
              "url": sghost('sgi', editorConf.sgSID),
              "parameters": [],
              "filterWrap": true,
              "filterKey": "filter",
            };

            var data = { "queries": [query] };

            query.parameters.push({ "key": "Index", "type": "value", "value": $scope.hit._index });
            query.parameters.push({ "key": "Type", "type": "value", "value": $scope.hit._type });
            query.parameters.push({ "key": "ID", "type": "value", "value": $scope.hit._id });

            debugger;

            columnsName = _.map(_.filter(_.values($scope.editorConfByName), i => { return i.type !== 'edit' }), 'name');

            var columnsDoc = _.transform(columnsName, function (result, field) {
              result[field] = $scope.flattened[field];
            }, {});

            var modify = { "key": "Modify", "type": "object", "value": doc };
            var columns = { "key": "Columns", "type": "object", "value": columnsDoc };

            query.parameters.push(modify);
            query.parameters.push(columns);

            query.parameters = [];
            query.parameters.push({ "key": "Page", "type": "value", "value": "1" });
            query.parameters.push({ "key": "Rows", "type": "value", "value": "1" });
            var filterKey = { "key": "FilterKey", "type": "object", "value": {} };
            filterKey.value.SortField = "1";
            filterKey.value.KeyValue = "";
            query.parameters.push(filterKey);
            return data;
          },
          call: function (strategy, doc) {
            return this['call' + strategy](doc);
          },
          'calles': function (doc) {
            return es.update({
              index: $scope.hit._index,
              type: $scope.hit._type,
              id: $scope.hit._id,
              refresh: true,
              fields: _.keys(doc),
              body: { doc }
            }).then(function (resp) {
              _.each(doc, (value, key) => {
                $scope.flattened[key] = value;
              });
              $scope.originalFlattened = _.clone($scope.flattened);

              $scope.$emit('editor-complete');
              return true;
            });
          },
          'callsg': function (doc) {
            if (_.isEmpty(editorConf.sgSID)) {
              return Promise.reject("SID未配置");
            }

            var data = this._genSgData(doc);
            return new Promise(function (resolve, reject) {
              $http.post('/callteldsg/_sg',
                data,
                {
                  headers: { 'Content-Type': 'application/json' }
                }).success((data, header, config, status) => {
                  debugger;
                  var dataset = data.results[0].dataset[0];
                  resolve(dataset);
                }).error(function () {
                  reject("SG调用失败");
                });
            });
          },
          'callsg-es': function (doc) {
            return this.callsg(doc).then((sgData) => {
              if (sgData) {
                return this.calles(doc);
              } else {
                notify.warning("调用SG方法返回不是预期值！");
                return false;
              }
            });
          }
        };

        $scope.update = function (row, field) {

          var doc = _.transform($scope.flattened, (result, value, key) => {
            if (value !== $scope.originalFlattened[key]) {
              result[key] = value;
            }
          }, {});

          var strategy = editorConf.strategy || 'es';
          strategyFun.call(strategy, doc).then(data => {
            if (data) { notify.info('成功'); }
            else { notify.warning('失败'); }
          }).catch(notify.warning);
        };

        $scope.showArrayInObjectsWarning = function (row, field) {
          let value = $scope.flattened[field];
          return _.isArray(value) && typeof value[0] === 'object';
        };
      }
    }
  };
});
