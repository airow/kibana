import _ from 'lodash';
//import require from 'require';
import angular from 'angular';
import rison from 'rison-node';
import registry from 'plugins/kibana/management/saved_object_registry';
import objectEditHTML from 'plugins/kibana/management/sections/objects/_edit.html';
import IndexPatternsCastMappingTypeProvider from 'ui/index_patterns/_cast_mapping_type';
import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';

import DiscoverUiConfProvider from 'plugins/kibana/ui_conf_provider/discover_uiconf';
import DashboardUiConfProvider from 'plugins/kibana/ui_conf_provider/dashboard_uiconf';
import VisualizationUiConfProvider from 'plugins/kibana/ui_conf_provider/visualization_uiconf';
import indexTemplate from 'plugins/kibana/management/sections/indices/index.html';
const indexPatternsResolutions = {
  indexPatternIds: function (courier) {
    return courier.indexPatterns.getIds();
  }
};
uiRoutes
  .when('/management/kibana/objects/edit/:service/:id', {
    template: objectEditHTML,
    resolve: indexPatternsResolutions
  });

uiModules.get('apps/management')
  .filter('startsWith', function () {
    return function (input, findStr) {
      input = input || '';
      var out = _.startsWith(input, findStr);
      return out;
    };
  })
  .directive('kbnManagementObjectsEdit', function ($route, kbnIndex, kbnUrl, Notifier) {
    return {
      restrict: 'E',
      transclude: true,
      // scope: {
      //   sectionName: '@section'
      // },
      template: indexTemplate,
      link: function ($scope) {
        const ids = $route.current.locals.indexPatternIds;
        $scope.defaultIndex = true;
        $scope.indexPatternList = ids.map(function (id) {
          return {
            id: id,
            url: kbnUrl.eval('#/management/kibana/objects/{{id}}', { id: id }),
            class: 'sidebar-item-title ' + ($scope.editingId === id ? 'active' : ''),
            default: $scope.defaultIndex === id
          };
        });

        $scope.$emit('application.load');
      },
      controller: function ($scope, $injector, $routeParams, $location, $window, $rootScope, es, Private, $filter) {
        const notify = new Notifier({ location: 'SavedObject view' });
        const castMappingType = Private(IndexPatternsCastMappingTypeProvider);
        const serviceObj = registry.get($routeParams.service);
        const service = $injector.get(serviceObj.service);

        /**
         * Creates a field definition and pushes it to the memo stack. This function
         * is designed to be used in conjunction with _.reduce(). If the
         * values is plain object it will recurse through all the keys till it hits
         * a string, number or an array.
         *
         * @param {array} memo The stack of fields
         * @param {mixed} value The value of the field
         * @param {string} key The key of the field
         * @param {object} collection This is a reference the collection being reduced
         * @param {array} parents The parent keys to the field
         * @returns {array}
         */
        const createField = function (memo, val, key, collection, parents) {
          if (_.isArray(parents)) {
            parents.push(key);
          } else {
            parents = [key];
          }

          const field = { type: 'text', name: parents.join('.'), value: val };

          if (_.isString(field.value)) {
            try {
              field.value = angular.toJson(JSON.parse(field.value), true);
              field.type = 'json';
            } catch (err) {
              field.value = field.value;
            }
          } else if (_.isNumeric(field.value)) {
            field.type = 'number';
          } else if (_.isArray(field.value)) {
            field.type = 'array';
            field.value = angular.toJson(field.value, true);
          } else if (_.isBoolean(field.value)) {
            field.type = 'boolean';
            field.value = field.value;
          } else if (_.isPlainObject(field.value)) {
            // do something recursive
            return _.reduce(field.value, _.partialRight(createField, parents), memo);
          }

          memo.push(field);

          // once the field is added to the object you need to pop the parents
          // to remove it since we've hit the end of the branch.
          parents.pop();
          return memo;
        };

        const readObjectClass = function (fields, Class) {
          const fieldMap = _.indexBy(fields, 'name');

          _.forOwn(Class.mapping, function (esType, name) {
            if (fieldMap[name]) return;

            fields.push({
              name: name,
              type: (function () {
                switch (castMappingType(esType)) {
                  case 'string': return 'text';
                  case 'number': return 'number';
                  case 'boolean': return 'boolean';
                  default: return 'json';
                }
              }())
            });
          });

          if (Class.searchSource && !fieldMap['kibanaSavedObjectMeta.searchSourceJSON']) {
            fields.push({
              name: 'kibanaSavedObjectMeta.searchSourceJSON',
              type: 'json',
              value: '{}'
            });
          }
        };

        $scope.notFound = $routeParams.notFound;

        $scope.title = service.type;

        $scope.checkFieldAllowEdit = function (fieldName) {
          let returnValue = service.Class && service.Class.allowEdit;
          returnValue = returnValue || $filter('startsWith')(fieldName, 'uiConf.');
          return returnValue;
        }

        $scope.allowEdit = function () {
          let returnValue = service.Class && service.Class.allowEdit;
          return returnValue;
        };

        es.get({
          index: kbnIndex,
          type: service.type,
          id: $routeParams.id
        })
          .then(function (obj) {

            // /** 处理功能菜单 */
            // obj._source.menus = obj._source.menus || [];

            // let uiConfProvider = {
            //   'search': Private(DiscoverUiConfProvider),
            //   'dashboard': Private(DashboardUiConfProvider),
            //   'visualization': Private(VisualizationUiConfProvider)
            // }
            // let uiConf_default = uiConfProvider[service.type].defaultConf;

            if (service.Class && service.Class.hasUiConf) {
              let timefilterSchema = { disabled: true, timeFrom: '', timeTo: '' };
              //timefilter_Schema.refreshInterval = { display: '暂停', pause: false, value: '' };
              let navigationSchema = {
                'conf_id': 'navigationConf的id，配置了conf_id将忽略url，但disabled依然有效',
                'display': '显示的名称',
                'url': '#/visualize/edit/{visualize name} 或 #/discover/{discover name}',
                'disabled': true
              };
              let authObjSchema = { disable: true, '绑定字段': ['授权对象名称'] };
              let columnConfSchema = {
                "rowStyle": false,
                fieldName: '绑定字段',
                disable: true,
                'coloring': {
                  'bgColor': false,
                  'strategy': 'ranges|thresholds|expression|enumeration|custom',
                  'template': '<span>${value}</span>',
                  'ranges': [
                    { 'range': '[0 TO 10)', 'color': 'red' },
                    { 'range': '[10 TO 15]', 'color': 'green' },
                    { 'range': '(15 TO *]', 'color': 'yellow' }
                  ],
                  'thresholds': [
                    { 'value': 0, 'color': 'red' },
                    { 'value': 50, 'color': 'red' }
                  ],
                  'enumeration': [
                    { 'value': '1', 'text': '公交站', 'color': 'red' },
                    { 'value': '2', 'text': '非公交' }
                  ],
                  'expression': {
                    'body': 'return value; //方法签名 fun(value, row, fieldName)'
                  },
                  "custom": {
                    "fun": "return {value:`<a href='http://www.baidu.com'>${value}</a>`}",
                    "fun_demo1": "return {style:{'background-color': 'red'}}; //自定义央视",
                    "fun_demo2": "return {style:{'color': 'white','background-color': 'black'}}; //自定义央视",
                    "fun_demo3": "return value=='222' ? {value:value, style:{'color': 'red'}} : {value:value+'ccc'};",
                    "fun_demo4": "return {value:`<a href='http://www.baidu.com'>${value}</a>`}; //添加链接"
                  }
                },
                'style': 'width:100px'
              };
              /** 默认显示配置项 */
              let uiConfDefault = {
                showTimeDiagram: true, menus: [], pageSize: 100, sizeRange: [], authObj: [authObjSchema], navigation: [navigationSchema],
                columnConf: [columnConfSchema],
                timefilter: angular.toJson(timefilterSchema)
              };

              obj._source.uiConf = obj._source.uiConf || {};

              for (let key in uiConfDefault) {
                if (false === (key in obj._source.uiConf)) {
                  obj._source.uiConf[key] = uiConfDefault[key];
                }
              }
            }

            $scope.obj = obj;
            $scope.link = service.urlFor(obj._id);

            const fields = _.reduce(obj._source, createField, []);
            if (service.Class) readObjectClass(fields, service.Class);
            $scope.fields = _.sortBy(fields, 'name');
          })
          .catch(notify.fatal);

        // This handles the validation of the Ace Editor. Since we don't have any
        // other hooks into the editors to tell us if the content is valid or not
        // we need to use the annotations to see if they have any errors. If they
        // do then we push the field.name to aceInvalidEditor variable.
        // Otherwise we remove it.
        const loadedEditors = [];
        $scope.aceInvalidEditors = [];

        $scope.aceLoaded = function (editor) {
          if (_.contains(loadedEditors, editor)) return;
          loadedEditors.push(editor);

          editor.$blockScrolling = Infinity;

          const session = editor.getSession();
          const fieldName = editor.container.id;

          session.setTabSize(2);
          session.setUseSoftTabs(true);
          session.on('changeAnnotation', function () {
            const annotations = session.getAnnotations();
            if (_.some(annotations, { type: 'error' })) {
              if (!_.contains($scope.aceInvalidEditors, fieldName)) {
                $scope.aceInvalidEditors.push(fieldName);
              }
            } else {
              $scope.aceInvalidEditors = _.without($scope.aceInvalidEditors, fieldName);
            }

            if ($rootScope.$$phase) $scope.$apply();
          });
        };

        $scope.cancel = function () {
          $window.history.back();
          return false;
        };

        /**
         * Deletes an object and sets the notification
         * @param {type} name description
         * @returns {type} description
         */
        $scope.delete = function () {
          es.delete({
            index: kbnIndex,
            type: service.type,
            id: $routeParams.id
          })
            .then(function (resp) {
              return redirectHandler('deleted');
            })
            .catch(notify.fatal);
        };

        $scope.submit = function () {
          const source = _.cloneDeep($scope.obj._source);

          _.each($scope.fields, function (field) {
            let value = field.value;

            if (field.type === 'number') {
              value = Number(field.value);
            }

            if (field.type === 'array') {
              value = JSON.parse(field.value);
            }

            _.set(source, field.name, value);
          });

          es.index({
            index: kbnIndex,
            type: service.type,
            id: $routeParams.id,
            body: source
          })
            .then(function (resp) {
              return redirectHandler('updated');
            })
            .catch(notify.fatal);
        };

        function redirectHandler(action) {
          return es.indices.refresh({
            index: kbnIndex
          })
            .then(function (resp) {
              const msg = 'You successfully ' + action + ' the "' + $scope.obj._source.title + '" ' + $scope.title.toLowerCase() + ' object';

              $location.path('/management/kibana/objects').search({
                _a: rison.encode({
                  tab: serviceObj.title
                })
              });
              notify.info(msg);
            });
        }
      }
    };
  });