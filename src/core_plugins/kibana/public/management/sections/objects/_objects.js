import { saveAs } from '@spalger/filesaver';
import { extend, find, flattenDeep, partialRight, pick, pluck, sortBy } from 'lodash';
import angular from 'angular';
import registry from 'plugins/kibana/management/saved_object_registry';
import objectIndexHTML from 'plugins/kibana/management/sections/objects/_objects.html';
import 'ui/directives/file_upload';
import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';
import indexTemplate from 'plugins/kibana/management/sections/indices/index.html';

const MAX_SIZE = Math.pow(2, 31) - 1;
const indexPatternsResolutions = {
  indexPatternIds: function (courier) {
    return courier.indexPatterns.getIdsTeld();
  }
};
uiRoutes
  .when('/management/kibana/objects', {
    template: objectIndexHTML,
    resolve: indexPatternsResolutions
  });

uiRoutes
  .when('/management/kibana/objects/:indexPatternId', {
    template: objectIndexHTML,
    resolve: indexPatternsResolutions
  });

uiModules.get('apps/management')
  .filter('filterPlan', function () {
    return function (input, isPublic, indexPatternId) {
      if (indexPatternId) {
        input = _.filter(input, item => {
          if (item.kibanaSavedObjectMeta) {
            let searchSourceJSON = item.kibanaSavedObjectMeta.searchSourceJSON;
            if (searchSourceJSON) {
              let searchSource = JSON.parse(searchSourceJSON);
              return searchSource.index === indexPatternId;
            }
          }
          return true;
        });
      }

      return _.filter(input, item => {
        if (isPublic) {
          return !_.has(item, 'uiConf.owner.UserId');
        } else {
          return _.has(item, 'uiConf.owner.UserId');
        }
      });
    };
  })
  .directive('kbnManagementObjects', function ($route, kbnIndex, Notifier, Private, kbnUrl, Promise) {
    return {
      restrict: 'E',
      transclude: true,
      // scope: {
      //   sectionName: '@section'
      // },
      template: indexTemplate,
      link: function ($scope) {
        const ids = $route.current.locals.indexPatternIds;
        // $scope.advancedFilter = "";
        $scope.editingId = $route.current.params.indexPatternId;
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
      controller: function ($scope, $injector, $q, AppState, es) {
        const notify = new Notifier({ location: 'Saved Objects' });

        const $state = $scope.state = new AppState();
        $scope.currentTab = null;
        $scope.selectedItems = [];

        $scope.folder = ['公有方案', '私有方案'];

        const getData = function (filter) {
          let registryItems = registry.all();
          if (window.top !== window) {
            registryItems = _.filter(registryItems, { service: "savedSearches" })
          }
          const services = registryItems.map(function (obj) {
            const service = $injector.get(obj.service);
            return service.find(filter, 10000).then(function (data) {
              return {
                service: service,
                serviceName: obj.service,
                title: obj.title,
                type: service.type,
                data: data.hits,
                total: data.total
              };
            });
          });

          $q.all(services).then(function (data) {
            $scope.services = sortBy(data, 'title');
            let tab = $scope.services[0];
            if ($state.tab) $scope.currentTab = tab = find($scope.services, { title: $state.tab });

            $scope.$watch('state.tab', function (tab) {
              if (!tab) $scope.changeTab($scope.services[0]);
            });
          });
        };


        $scope.toggleAll = function () {
          if ($scope.selectedItems.length === $scope.currentTab.data.length) {
            $scope.selectedItems.length = 0;
          } else {
            $scope.selectedItems = [].concat($scope.currentTab.data);
          }
        };

        $scope.toggleItem = function (item) {
          const i = $scope.selectedItems.indexOf(item);
          if (i >= 0) {
            $scope.selectedItems.splice(i, 1);
          } else {
            $scope.selectedItems.push(item);
          }
        };

        $scope.open = function (item) {
          kbnUrl.change(item.url.substr(1));
        };

        $scope.edit = function (service, item) {
          const params = {
            service: service.serviceName,
            id: item.id
          };

          if (params.service === 'savedSearches') {
            kbnUrl.change('/management/kibana/objects/edit_v2/{{ service }}/{{ id }}', params);
          } else {
            kbnUrl.change('/management/kibana/objects/edit/{{ service }}/{{ id }}', params);
          }
        };

        $scope.editJson = function (service, item) {
          const params = {
            service: service.serviceName,
            id: item.id
          };

          kbnUrl.change('/management/kibana/objects/edit/{{ service }}/{{ id }}', params);
        };

        $scope.bulkDelete = function () {
          $scope.currentTab.service.delete(pluck($scope.selectedItems, 'id'))
            .then(refreshData)
            .then(function () {
              $scope.selectedItems.length = 0;
            })
            .catch(error => notify.error(error));
        };

        $scope.bulkExport = function () {
          const objs = $scope.selectedItems.map(partialRight(extend, { type: $scope.currentTab.type }));
          retrieveAndExportDocs(objs);
        };

        $scope.exportAll = () => Promise
          .map($scope.services, service => service.service
            .scanAll('')
            .then(result => result.hits.map(hit => extend(hit, { type: service.type })))
          )
          .then(results => retrieveAndExportDocs(flattenDeep(results)))
          .catch(error => notify.error(error));

        function retrieveAndExportDocs(objs) {
          if (!objs.length) return notify.error('No saved objects to export.');
          es.mget({
            index: kbnIndex,
            body: { docs: objs.map(transformToMget) }
          })
            .then(function (response) {
              saveToFile(response.docs.map(partialRight(pick, '_id', '_type', '_source')));
            });
        }

        // Takes an object and returns the associated data needed for an mget API request
        function transformToMget(obj) {
          return { _id: obj.id, _type: obj.type };
        }

        function saveToFile(results) {
          const blob = new Blob([angular.toJson(results, true)], { type: 'application/json' });
          saveAs(blob, 'export.json');
        }

        $scope.importAll = function (fileContents) {
          let docs;
          try {
            docs = JSON.parse(fileContents);
          } catch (e) {
            notify.error('The file could not be processed.');
          }

          return Promise.map(docs, function (doc) {
            const service = find($scope.services, { type: doc._type }).service;
            return service.get().then(function (obj) {
              obj.id = doc._id;
              return obj.applyESResp(doc).then(function () {
                return obj.save();
              });
            });
          })
            .then(refreshIndex)
            .then(refreshData, notify.error);
        };

        function refreshIndex() {
          return es.indices.refresh({
            index: kbnIndex
          });
        }

        function refreshData() {
          return getData($scope.advancedFilter);
        }

        $scope.filterkeydown = function (e, advancedFilter) {
          if (e.keycode == 13) {
            $scope.advancedFilter = advancedFilter;
          }
        }

        $scope.refreshDataByFilter = function (advancedFilter) {
          $scope.advancedFilter = advancedFilter;
          // return refreshData();
        }

        $scope.changeTab = function (tab) {
          $scope.currentTab = tab;
          $scope.selectedItems.length = 0;
          $state.tab = tab.title;
          $state.service = '公有方案';
          $state.save();
        };



        $scope.$watch('advancedFilter', function (filter) {
          getData(filter);
        });
      }
    };
  });
