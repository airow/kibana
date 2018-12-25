import _ from 'lodash';
import 'plugins/kibana/visualize/saved_visualizations/saved_visualizations';
import 'plugins/kibana/visualize/editor/sidebar';
import 'plugins/kibana/visualize/editor/agg_filter';
import 'ui/visualize';
import 'ui/collapsible_sidebar';
import 'ui/share';
import angular from 'angular';
import Notifier from 'ui/notify/notifier';
import RegistryVisTypesProvider from 'ui/registry/vis_types';
import DocTitleProvider from 'ui/doc_title';
import UtilsBrushEventProvider from 'ui/utils/brush_event';
import FilterBarQueryFilterProvider from 'ui/filter_bar/query_filter';
import FilterBarFilterBarClickHandlerProvider from 'ui/filter_bar/filter_bar_click_handler';
import stateMonitorFactory from 'ui/state_management/state_monitor_factory';
import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';
import editorTemplate from 'plugins/kibana/visualize/editor/editor.html';

import 'plugins/kibana/advanced_search/state/teld_state';
import 'plugins/kibana/navigation/directives/navigation';
import getAuthObjValue from 'plugins/kibana/extension/teld_auth_obj';

uiRoutes
.when('/visualize/create', {
  template: editorTemplate,
  resolve: {
    savedVis: function (savedVisualizations, courier, $route, Private, $http) {
      const visTypes = Private(RegistryVisTypesProvider);
      const visType = _.find(visTypes, {name: $route.current.params.type});
      if (visType.requiresSearch && !$route.current.params.indexPattern && !$route.current.params.savedSearchId) {
        throw new Error('You must provide either an indexPattern or a savedSearchId');
      }

      return savedVisualizations.get($route.current.params)
      .then(savedObjects => {
        var ip = savedObjects.vis.indexPattern;
        var authObjConf = _.filter(ip.fields, item => { return _.isEmpty(item.authObjs) === false; });
        authObjConf = _.map(authObjConf, field => {
          var obj = {};
          obj[field.name] = field.authObjs.split('|');
          return obj;
        });

        if (_.size(authObjConf) > 0) {
          return getAuthObjValue($http, authObjConf).then(authObjValue => {
            savedObjects.authObjValue = authObjValue;
            return savedObjects;
          });
        } else {
          return savedObjects;
        }
      })
      .catch(courier.redirectWhenMissing({
        '*': '/visualize'
      }));
    }
  }
})
.when('/visualize/edit/:id', {
  template: editorTemplate,
  resolve: {
    savedVis: function (savedVisualizations, courier, $route,$http) {
      return savedVisualizations.get($route.current.params.id)
      .then(savedObjects => {
        debugger;
        var authObj = _.get(savedObjects.uiConf, 'authObj', []);
        var authObjConf = _.filter(authObj, item => { return !item.disable; });
        if (_.size(authObjConf) > 0) {
          return getAuthObjValue($http, authObjConf)
            .then(authObjValue => {
              savedObjects.authObjValue = authObjValue;
              return savedObjects;
            });
        } else {
          var refIndex = angular.fromJson(savedObjects.kibanaSavedObjectMeta.searchSourceJSON).index;
          return courier.indexPatterns.get(refIndex).then(ip => {
            var authObjConf = _.filter(ip.fields, item => { return _.isEmpty(item.authObjs) === false; });
            authObjConf = _.map(authObjConf, field => {
              var obj = {};
              obj[field.name] = field.authObjs.split('|');
              return obj;
            });

            if (_.size(authObjConf) > 0) {
              return getAuthObjValue($http, authObjConf).then(authObjValue => {
                savedObjects.authObjValue = authObjValue;
                return savedObjects;
              });
            } else {
              return savedObjects;
            }
          });
        }
      })
      .catch(courier.redirectWhenMissing({
        'visualization': '/visualize',
        'search': '/management/kibana/objects/savedVisualizations/' + $route.current.params.id,
        'index-pattern': '/management/kibana/objects/savedVisualizations/' + $route.current.params.id,
        'index-pattern-field': '/management/kibana/objects/savedVisualizations/' + $route.current.params.id
      }));
    }
  }
});

uiModules
.get('app/visualize', [
  'kibana/notify',
  'kibana/courier'
])
.directive('visualizeApp', function () {
  return {
    restrict: 'E',
    controllerAs: 'visualizeApp',
    controller: VisEditor,
  };
});

function VisEditor($scope, $route, timefilter, AppState, $location, kbnUrl, $timeout, courier, Private, Promise, advancedSearch, TeldState, globalState, teldSession) {
  const docTitle = Private(DocTitleProvider);
  const brushEvent = Private(UtilsBrushEventProvider);
  const queryFilter = Private(FilterBarQueryFilterProvider);
  const filterBarClickHandler = Private(FilterBarFilterBarClickHandlerProvider);

  const notify = new Notifier({
    location: 'Visualization Editor'
  });

  let stateMonitor;
  const $appStatus = this.appStatus = {};

  // Retrieve the resolved SavedVis instance.
  const savedVis = $route.current.locals.savedVis;

  // Instance of src/ui/public/vis/vis.js.
  const vis = savedVis.vis;

  // Clone the _vis instance.
  const editableVis = vis.createEditableVis();

  // We intend to keep editableVis and vis in sync with one another, so calling `requesting` on
  // vis should call it on both.
  vis.requesting = function () {
    const requesting = editableVis.requesting;
    // Invoking requesting() calls onRequest on each agg's type param. When a vis is marked as being
    // requested, the bounds of that vis are updated and new data is fetched using the new bounds.
    requesting.call(vis);

    // We need to keep editableVis in sync with vis.
    requesting.call(editableVis);
  };

  // SearchSource is a promise-based stream of search results that can inherit from other search
  // sources.
  const searchSource = savedVis.searchSource;

  if (vis.indexPattern.hasTimeField() && !globalState.time && savedVis.uiConf.timefilter) {

    let uiConf_timefilter = angular.fromJson(savedVis.uiConf.timefilter);

    if (!uiConf_timefilter.disabled && uiConf_timefilter.timeTo && uiConf_timefilter.timeFrom) {
      timefilter.time.to = uiConf_timefilter.timeTo;
      timefilter.time.from = uiConf_timefilter.timeFrom;
      if (uiConf_timefilter.refreshInterval) {
        timefilter.refreshInterval = uiConf_timefilter.refreshInterval;
      }
    }
  }

  let postData = {
    "eventType": "hello",
    "eventArgs": "I'm from kibana visualizeController"
  };
  $scope.$emit('$messageOutgoing', angular.toJson(postData));

  postData.eventType = "syncTimeRange";
  $scope.$emit('$messageOutgoing', angular.toJson(postData));

  this.$scope = $scope;

  const $TeldState = $scope.TeldState = new TeldState();
  let teldUser = $scope.teldUser = teldSession.getUser();
  $TeldState.advancedSearchBool = ($TeldState.advancedSearchBool || savedVis.uiConf.advancedSearchBool) || {};
  $TeldState.save();
  $scope.advancedSearch = advancedSearch.advancedSearch2UiBind($TeldState.advancedSearchBool, advancedSearch.getFieldSource(vis.indexPattern));

  $scope.topNavMenu = getTopNavMenu(savedVis.uiConf.menus);

  function getTopNavMenu(menuKeys) {

    let confTopNavMenu = {
      'refresh': {
        key: '刷新',
        description: 'Refresh',
        run: function () { $scope.fetch(); },
        testId: 'visualizeRefreshButton',
      },
      'save': {
        key: '保存',
        description: '保存',
        template: require('plugins/kibana/visualize/editor/panels/save_zh_CN.html'),
        testId: 'visualizeSaveButton',
      },
      'open': {
        key: '打开',
        description: '打开',
        template: require('plugins/kibana/visualize/editor/panels/load_zh_CN.html'),
        testId: 'visualizeOpenButton',
      },
      "help": {
        key: '帮助',
        description: '帮助',
        run: function () {
          window.open("/doc/help/kibana_discover_help.htm");
          //$scope.helpDialog();
        },
        testId: 'visualizeHelpButton',
      },
      'adv': {
        key: '高级过滤',
        description: '高级过滤',
        template: require('plugins/kibana/discover/partials/adv_search_zh_CN.html'),
        run: function (menuItem, kbnTopNav) {
          $scope.showAdvancedSearch = !$scope.showAdvancedSearch;
          //kbnTopNav.setCurrent(menuItem.key);
          kbnTopNav.toggle(menuItem.key);
        },
        testId: 'visualizeOpenButton',
      },
      'navigation': {
        key: '统计分析',
        description: '统计分析',
        template: require('plugins/kibana/visualize/editor/panels/load_navigation.html'),
        run: function (menuItem, kbnTopNav) {
          //kbnTopNav.setCurrent(menuItem.key);
          kbnTopNav.toggle(menuItem.key);
        },
        testId: 'discoverNavigationButton',
      }
    };

    let menus = [];
    if (menuKeys && menuKeys.length == 0) {
      for (let key in confTopNavMenu) {
        menuKeys.push(key);
      }
    }
    menuKeys.forEach(function (value) {
      let confMenu = confTopNavMenu[value];
      if (confMenu) {
        menus.push(confMenu);
      }
    });

    return menus;
  }

  //$scope.topNavMenu = [
  // {
  //   key: 'new',
  //   description: 'New Visualization',
  //   run: function () { kbnUrl.change('/visualize', {}); },
  //   testId: 'visualizeNewButton',
  // }, {
  //   key: 'save',
  //   description: 'Save Visualization',
  //   template: require('plugins/kibana/visualize/editor/panels/save.html'),
  //   testId: 'visualizeSaveButton',
  // }, {
  //   key: 'open',
  //   description: 'Open Saved Visualization',
  //   template: require('plugins/kibana/visualize/editor/panels/load.html'),
  //   testId: 'visualizeOpenButton',
  // }, {
  //   key: 'share',
  //   description: 'Share Visualization',
  //   template: require('plugins/kibana/visualize/editor/panels/share.html'),
  //   testId: 'visualizeShareButton',
  // },
  // {
  //   key: '刷新',
  //   description: 'Refresh',
  //   run: function () { $scope.fetch(); },
  //   testId: 'visualizeRefreshButton',
  // }];

  if (savedVis.id) {
    docTitle.change(savedVis.title);
  }

  // Extract visualization state with filtered aggs. You can see these filtered aggs in the URL.
  // Consists of things like aggs, params, listeners, title, type, etc.
  const savedVisState = vis.getState();
  const stateDefaults = {
    uiState: savedVis.uiStateJSON ? JSON.parse(savedVis.uiStateJSON) : {},
    linked: !!savedVis.savedSearchId,
    query: searchSource.getOwn('query') || {query_string: {query: '*'}},
    filters: searchSource.getOwn('filter') || [],
    index: vis.indexPattern.id,
    vis: savedVisState
  };

  // Instance of app_state.js.
  let $state = $scope.$state = (function initState() {
    // This is used to sync visualization state with the url when `appState.save()` is called.
    const appState = new AppState(stateDefaults);

    // The savedVis is pulled from elasticsearch, but the appState is pulled from the url, with the
    // defaults applied. If the url was from a previous session which included modifications to the
    // appState then they won't be equal.
    if (!angular.equals(appState.vis, savedVisState)) {
      Promise.try(function () {
        editableVis.setState(appState.vis);
        vis.setState(editableVis.getEnabledState());
      })
      .catch(courier.redirectWhenMissing({
        'index-pattern-field': '/visualize'
      }));
    }

    return appState;
  }());

  function init() {
    // export some objects
    $scope.savedVis = savedVis;
    $scope.searchSource = searchSource;
    $scope.vis = vis;
    $scope.indexPattern = vis.indexPattern;
    $scope.editableVis = editableVis;
    $scope.state = $state;

    // Create a PersistedState instance.
    $scope.uiState = $state.makeStateful('uiState');
    $scope.appStatus = $appStatus;

    // Associate PersistedState instance with the Vis instance, so that
    // `uiStateVal` can be called on it. Currently this is only used to extract
    // map-specific information (e.g. mapZoom, mapCenter).
    vis.setUiState($scope.uiState);

    $scope.timefilter = timefilter;
    $scope.opts = _.pick($scope, 'doSave', 'savedVis', 'shareData', 'timefilter');

    stateMonitor = stateMonitorFactory.create($state, stateDefaults);
    stateMonitor.ignoreProps([ 'vis.listeners' ]).onChange((status) => {
      $appStatus.dirty = status.dirty;
    });
    $scope.$on('$destroy', () => stateMonitor.destroy());

    editableVis.listeners.click = vis.listeners.click = filterBarClickHandler($state);
    editableVis.listeners.brush = vis.listeners.brush = brushEvent($state);

    // track state of editable vis vs. "actual" vis
    $scope.stageEditableVis = transferVisState(editableVis, vis, true);
    $scope.resetEditableVis = transferVisState(vis, editableVis);
    $scope.$watch(function () {
      return editableVis.getEnabledState();
    }, function (newState) {
      editableVis.dirty = !angular.equals(newState, vis.getEnabledState());

      $scope.responseValueAggs = null;
      try {
        $scope.responseValueAggs = editableVis.aggs.getResponseAggs().filter(function (agg) {
          return _.get(agg, 'schema.group') === 'metrics';
        });
      }
      // this can fail when the agg.type is changed but the
      // params have not been set yet. watcher will trigger again
      // when the params update
      catch (e) {} // eslint-disable-line no-empty
    }, true);

    $state.replace();

    $scope.$watch('searchSource.get("index").timeFieldName', function (timeField) {
      timefilter.enabled = !!timeField;
    });

    // update the searchSource when filters update
    $scope.$listen(queryFilter, 'update', function () {
      searchSource.set('filter', queryFilter.getFilters());
      $state.save();
    });

    // fetch data when filters fire fetch event
    $scope.$listen(queryFilter, 'fetch', $scope.fetch);


    $scope.$listen($state, 'fetch_with_changes', function (keys) {
      if (_.contains(keys, 'linked') && $state.linked === true) {
        // abort and reload route
        $route.reload();
        return;
      }

      if (_.contains(keys, 'vis')) {
        $state.vis.listeners = _.defaults($state.vis.listeners || {}, vis.listeners);

        // only update when we need to, otherwise colors change and we
        // risk loosing an in-progress result
        vis.setState($state.vis);
        editableVis.setState($state.vis);
      }

      // we use state to track query, must write before we fetch
      if ($state.query && !$state.linked) {
        searchSource.set('query', $state.query);
      } else {
        searchSource.set('query', null);
      }

      if (_.isEqual(keys, ['filters'])) {
        // updates will happen in filter watcher if needed
        return;
      }

      $scope.fetch();
    });

    // Without this manual emission, we'd miss filters and queries that were on the $state initially
    $state.emit('fetch_with_changes');

    $scope.$listen(timefilter, 'fetch', _.bindKey($scope, 'fetch'));

    $scope.$on('ready:vis', function () {
      $scope.$emit('application.load');
    });

    $scope.$on('$destroy', function () {
      savedVis.destroy();
    });
  }

  $scope.$on('advancedSearch.condition.disable', function (d, data) {
    $scope.fetch();
  });

  $scope.fetch = function () {
    //savedVis.uiConf.advancedSearchBool = advancedSearch.syncAdvancedSearch($scope.advancedSearch);
    $TeldState.advancedSearchBool = advancedSearch.syncAdvancedSearch($scope.advancedSearch);
    $TeldState.save();
    let esQueryDSL = advancedSearch.syncAdvancedSearch2EsQueryDSL($scope.advancedSearch);
    $scope.kbnTopNav.close();
    $state.save();
    searchSource.set('filter', queryFilter.getFilters());
    searchSource.set('dpfilter', savedVis.authObjValue);
    searchSource.set('advancedSearch', esQueryDSL);
    if (!$state.linked) searchSource.set('query', $state.query);
    if ($scope.vis.type.requiresSearch) {
      courier.fetch();
    }
  };

  $scope.startOver = function () {
    kbnUrl.change('/visualize', {});
  };

  /**
   * Called when the user clicks "Save" button.
   */
  $scope.doSave = function () {
    savedVis.id = savedVis.title;
    // vis.title was not bound and it's needed to reflect title into visState
    $state.vis.title = savedVis.title;
    savedVis.visState = $state.vis;
    savedVis.uiStateJSON = angular.toJson($scope.uiState.getChanges());

    savedVis.uiConf.advancedSearchBool = $TeldState.advancedSearchBool;
    teldSession.setSavedObjOwner(savedVis);

    if (vis.indexPattern.hasTimeField()) {
      let uiConf_timefilter = { disabled: false, timeFrom: timefilter.time.from, timeTo: timefilter.time.to };
      //uiConf_timefilter.refreshInterval = _.pick(timefilter.refreshInterval, ['display', 'pause', 'section', 'value']);

      savedVis.uiConf.timefilter = angular.toJson(uiConf_timefilter);
    }
    delete savedVis.searchSource._state.dpfilter;
    savedVis.save()
    .then(function (id) {
      stateMonitor.setInitialState($state.toJSON());
      $scope.kbnTopNav.close('save');

      if (id) {
        notify.info('Saved Visualization "' + savedVis.title + '"');
        if (savedVis.id === $route.current.params.id) return;
        kbnUrl.change('/visualize/edit/{{id}}', {id: savedVis.id});
      }
    }, notify.fatal);
  };

  $scope.unlink = function () {
    if (!$state.linked) return;

    notify.info(`Unlinked Visualization "${savedVis.title}" from Saved Search "${savedVis.savedSearch.title}"`);

    $state.linked = false;
    const parent = searchSource.getParent(true);
    const parentsParent = parent.getParent(true);

    delete savedVis.savedSearchId;
    parent.set('filter', _.union(searchSource.getOwn('filter'), parent.getOwn('filter')));

    // copy over all state except "aggs" and filter, which is already copied
    _(parent.toJSON())
    .omit('aggs')
    .forOwn(function (val, key) {
      searchSource.set(key, val);
    })
    .commit();

    $state.query = searchSource.get('query');
    $state.filters = searchSource.get('filter');
    searchSource.inherits(parentsParent);
  };

  function transferVisState(fromVis, toVis, stage) {
    return function () {

      //verify this before we copy the "new" state
      const isAggregationsChanged = !fromVis.aggs.jsonDataEquals(toVis.aggs);

      const view = fromVis.getEnabledState();
      const full = fromVis.getState();
      toVis.setState(view);
      editableVis.dirty = false;
      $state.vis = full;

      /**
       * Only fetch (full ES round trip), if the play-button has been pressed (ie. 'stage' variable) and if there
       * has been changes in the Data-tab.
       */
      if (stage && isAggregationsChanged) {
        $scope.fetch();
      } else {
        $state.save();
      }
    };
  }

  init();
};
