import _ from 'lodash';
import angular from 'angular'; //貌似非必需
require("ngDialog"); // 等效于 import ngDialog from 'ngDialog';
import moment from 'moment';
import getSort from 'ui/doc_table/lib/get_sort';
import dateMath from '@elastic/datemath';
import 'ui/doc_table';
import 'ui/visualize';
import 'ui/notify';
import 'ui/fixed_scroll';
import 'ui/directives/validate_json';
import 'ui/filters/moment';
import 'ui/courier';
import 'ui/index_patterns';
import 'ui/state_management/app_state';
import 'ui/timefilter';
import 'ui/highlight/highlight_tags';
import 'ui/share';
import VisProvider from 'ui/vis';
import DocTitleProvider from 'ui/doc_title';
import UtilsBrushEventProvider from 'ui/utils/brush_event';
import PluginsKibanaDiscoverHitSortFnProvider from 'plugins/kibana/discover/_hit_sort_fn';
import FilterBarQueryFilterProvider from 'ui/filter_bar/query_filter';
import FilterManagerProvider from 'ui/filter_manager';
import AggTypesBucketsIntervalOptionsProvider from 'ui/agg_types/buckets/_interval_options';
import stateMonitorFactory  from 'ui/state_management/state_monitor_factory';
import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';
import indexTemplate from 'plugins/kibana/discover/index.html';
import StateProvider from 'ui/state_management/state';
import rison from 'rison-node';

import RequestQueueProvider from 'ui/courier/_request_queue';
import CallClientProvider from 'ui/courier/fetch/call_client';

import { saveAs } from '@spalger/filesaver';
import DiscoverExportExcelProvider from '../export/discover_export_excel';

//import '../../ui_conf_provider/directives/top';
import 'plugins/kibana/ui_conf_provider/directives/top';
import 'plugins/kibana/advanced_search/directives/condition';
import 'plugins/kibana/advanced_search/services/advanced_search';
import 'plugins/kibana/advanced_search/state/teld_state';
import 'plugins/kibana/navigation/directives/navigation';

const app = uiModules.get('apps/discover', [
  'kibana/notify',
  'kibana/courier',
  'kibana/index_patterns',
]);

uiRoutes
.defaults(/discover/, {
  requireDefaultIndex: true
})
.when('/discover/:id?', {
  template: indexTemplate,
  reloadOnSearch: false,
  resolve: {
    ip: function (Promise, courier, config, $location, Private) {
      console.log("resolve.ip");
      const State = Private(StateProvider);
      return courier.indexPatterns.getIds()
      .then(function (list) {
        /**
         *  In making the indexPattern modifiable it was placed in appState. Unfortunately,
         *  the load order of AppState conflicts with the load order of many other things
         *  so in order to get the name of the index we should use, and to switch to the
         *  default if necessary, we parse the appState with a temporary State object and
         *  then destroy it immediatly after we're done
         *
         *  @type {State}
         */
        const state = new State('_a', {});

        const specified = !!state.index;
        const exists = _.contains(list, state.index);
        const id = exists ? state.index : config.get('defaultIndex');
        state.destroy();

        return Promise.props({
          list: list,
          loaded: courier.indexPatterns.get(id),
          stateVal: state.index,
          stateValFound: specified && exists
        });
      });
    },
    savedSearch: function (courier, savedSearches, $route) {
      console.log("resolve.savedSearch");
      /*
      * savedSearches负责注册和初始化src/core_plugins/kibana/public/discover/saved_searches/_saved_search.js
      * 在 _saved_search.js 文件中对type对mapping进行了扩展，添加了‘tagetIndex’用于保存对应的index关系
      *    _saved_search.js为src/ui/public/courier/saved_object/saved_object.js的子类
      *   _.class(SavedSearch).inherits(courier.SavedObject);
      *   【注意】在这里无法获取当前index的id，需要在“function discoverController”控制器中进行赋值
      *   savedSearch.tagetIndex=savedSearch.searchSource.get("index").id 【ref:@#设置索引id@2017-02-06 22:11:23】      *
      * */
      return savedSearches.get($route.current.params.id)
      .catch(courier.redirectWhenMissing({
        'search': '/discover',
        'index-pattern': '/management/kibana/objects/savedSearches/' + $route.current.params.id
      }));
    }
    // ,teldConf: function (Promise, courier, savedSearches, $route, es) {
    //   console.log(es);
    //   console.log("es"+$route.current.params.id);

    //   // let conf = Promise.props({});
    //   // if ($route.current.params.id) {
    //   //   conf = es.get({
    //   //     index: ".teld.conf",
    //   //     type: 'search',
    //   //     id: $route.current.params.id
    //   //   })
    //   //     .then(function (resp) {
    //   //       console.log("es get");
    //   //       console.log(resp);
    //   //     });
    //   // }

    //   // return conf;

    //   return es.get({
    //       index: ".teld.conf",
    //       type: 'search',
    //       id: $route.current.params.id
    //     })
    //       .then(function (resp) {
    //         console.log("es get");
    //         console.log(resp);
    //       });
    // }
  }
});

app.directive('discoverApp', function () {
  return {
    restrict: 'E',
    controllerAs: 'discoverApp',
    controller: discoverController
  };
});

function discoverController($http, $scope, $rootScope, config, courier, $route, $window, Notifier,
  AppState, timefilter, Promise, Private, kbnUrl, highlightTags, es, ngDialog, advancedSearch, TeldState, globalState, teldSession) {

    $rootScope.showNotify = true;

    // const teldConf = $route.current.locals.teldConf;
    // console.log(teldConf);

    console.log($route.current.locals.savedSearch);

  const Vis = Private(VisProvider);
  const docTitle = Private(DocTitleProvider);
  const brushEvent = Private(UtilsBrushEventProvider);
  const HitSortFn = Private(PluginsKibanaDiscoverHitSortFnProvider);
  const queryFilter = Private(FilterBarQueryFilterProvider);
  const filterManager = Private(FilterManagerProvider);


  const discoverExportExcel = Private(DiscoverExportExcelProvider);

  const notify = new Notifier({
    location: 'Discover'
  });

  $scope.intervalOptions = Private(AggTypesBucketsIntervalOptionsProvider);
  $scope.showInterval = false;

  $scope.intervalEnabled = function (interval) {
    return interval.val !== 'custom';
  };

  $scope.toggleInterval = function () {
    $scope.showInterval = !$scope.showInterval;
  };

  $scope.timefilter = timefilter;

  // the saved savedSearch
  const savedSearch = $route.current.locals.savedSearch;
  $scope.$on('$destroy', savedSearch.destroy);

  console.log(savedSearch.uiConf);
  //$scope.topNavMenu = getTopNavMenu(savedSearch.menus);
  $scope.topNavMenu = getTopNavMenu(savedSearch.uiConf.menus);

  function getTopNavMenu(menuKeys) {
    let confTopNavMenu = {
      "help": {
        key: '帮助',
        description: '帮助',
        run: function () {
          window.open("/doc/help/kibana_discover_help.htm");
          //$scope.helpDialog();
        },
        testId: 'discoverHelpButton',
      },
      'save': {
        key: '保存',
        description: '保存查询',
        template: require('plugins/kibana/discover/partials/save_search_zh_CN.html'),
        testId: 'discoverSaveButton',
      },
      'open': {
        key: '打开',
        description: '打开查询',
        template: require('plugins/kibana/discover/partials/load_search_zh_CN.html'),
        testId: 'discoverOpenButton',
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
        testId: 'discoverOpenButton',
      },
      'export': {
        key: '导出',
        description: '导出',
        run: function () {
          $scope.export();
        },
        testId: 'discoverExportButton',
      },
      'navigation': {
        key: '统计分析',
        description: '统计分析',
        template: require('plugins/kibana/discover/partials/load_navigation.html'),
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

    // menus.push({
    //   key: 'callNodejs',
    //   description: 'callNodejs',
    //   run: function () {
    //     $scope.callNodejs();
    //   },
    //   testId: 'callNodejsButton',
    // });

    return menus;
  }

  // the actual courier.SearchSource
  $scope.searchSource = savedSearch.searchSource;
  $scope.indexPattern = resolveIndexPatternLoading();
  $scope.searchSource.set('index', $scope.indexPattern);

  $scope.helpDialog = function () {
    ngDialog.open({
      width: '90%',
      height: '98%',
      template: '<div style="padding-top: 20px; height: 100%"><iframe style="border: 1px solid;border-radius: 8px;width: 100%;height: inherit;" src="/doc/help/kibana_discover_help.htm"></iframe></div>',
      className: 'ngdialog-theme-default',
      plain: true
    });
  }


  /*
  * #设置索引id@2017-02-06 22:11:23
  * savedSearch 对象为src/core_plugins/kibana/public/discover/saved_searches/saved_searches.js，在路由规则的resolve中初始化
  * */
  savedSearch.tagetIndex = savedSearch.searchSource.get("index").id

  if (savedSearch.id) {
    docTitle.change(savedSearch.title);
  }

  let stateMonitor;
  const $appStatus = $scope.appStatus = this.appStatus = {};
  const $state = $scope.state = new AppState(getStateDefaults());
  $scope.uiState = $state.makeStateful('uiState');

  function getStateDefaults() {
    return {
      query: $scope.searchSource.get('query') || '',
      sort: getSort.array(savedSearch.sort, $scope.indexPattern),
      columns: savedSearch.columns.length > 0 ? savedSearch.columns : config.get('defaultColumns'),
      //pageSize: savedSearch.pageSize ? savedSearch.pageSize : config.get('discover:sampleSize'),
      pageSize: savedSearch.uiConf.pageSize ? savedSearch.uiConf.pageSize : config.get('discover:sampleSize'),
      index: $scope.indexPattern.id,
      interval: 'auto',
      filters: _.cloneDeep($scope.searchSource.getOwn('filter'))
    };
  }

  if ($scope.indexPattern.hasTimeField() && !globalState.time && savedSearch.uiConf.timefilter) {

    let uiConf_timefilter = angular.fromJson(savedSearch.uiConf.timefilter);

    if (!uiConf_timefilter.disabled && uiConf_timefilter.timeTo && uiConf_timefilter.timeFrom) {
      timefilter.time.to = uiConf_timefilter.timeTo;
      timefilter.time.from = uiConf_timefilter.timeFrom;
      if (uiConf_timefilter.refreshInterval) {
        timefilter.refreshInterval = uiConf_timefilter.refreshInterval;
      }
    }
  }

  const $TeldState = $scope.TeldState = new TeldState();
  let teldUser = $scope.teldUser = teldSession.getUser();
  $TeldState.advancedSearchBool = ($TeldState.advancedSearchBool || savedSearch.uiConf.advancedSearchBool) || {};
  $TeldState.save();
  $scope.advancedSearch = advancedSearch.advancedSearch2UiBind($TeldState.advancedSearchBool, advancedSearch.getFieldSource($scope.indexPattern));

  $scope.$on('advancedSearch.condition.disable', function (d, data) {
    $scope.fetch();
  });

  $state.index = $scope.indexPattern.id;
  $state.sort = getSort.array($state.sort, $scope.indexPattern);

  $scope.$watchCollection('state.columns', function () {
    $state.save();
  });

  // $scope.$watchCollection('advancedSearch', function () {
  //   alert(1);
  // });

  $scope.opts = {
    // number of records to fetch, then paginate through
    //sampleSize: parseInt(savedSearch.pageSize || config.get('discover:sampleSize')),
    sampleSize: parseInt(savedSearch.uiConf.pageSize || config.get('discover:sampleSize')),
    //sampleSize: 10000 ,
    // Index to match
    index: $scope.indexPattern.id,
    timefield: $scope.indexPattern.timeFieldName,
    savedSearch: savedSearch,
    indexPatternList: $route.current.locals.ip.list,
    timefilter: $scope.timefilter
  };

  $scope.showAdvancedSearchDisplay = function () {
    let returnValue = true;
    if ($scope.advancedSearch.must && $scope.advancedSearch.must.length > 0) {
      return true;
    }
    if ($scope.advancedSearch.should && $scope.advancedSearch.should.length > 0) {
      return true;
    }
    if ($scope.advancedSearch.must_not && $scope.advancedSearch.must_not.length > 0) {
      return true;
    }
    return false;
  }

  //$scope.showAdvancedSearch = $scope.showAdvancedSearchDisplay();
  //$scope.showAdvancedSearch = true;

  const init = _.once(function () {
    const showTotal = 5;
    $scope.failuresShown = showTotal;
    $scope.showAllFailures = function () {
      $scope.failuresShown = $scope.failures.length;
    };
    $scope.showLessFailures = function () {
      $scope.failuresShown = showTotal;
    };

    stateMonitor = stateMonitorFactory.create($state, getStateDefaults());
    stateMonitor.onChange((status) => {
      $appStatus.dirty = status.dirty;
    });
    $scope.$on('$destroy', () => stateMonitor.destroy());

    $scope.updateDataSource()
    .then(function () {
      $scope.$listen(timefilter, 'fetch', function () {
        $scope.fetch();
      });

      $scope.$watchCollection('state.sort', function (sort) {
        if (!sort) return;

        // get the current sort from {key: val} to ["key", "val"];
        const currentSort = _.pairs($scope.searchSource.get('sort')).pop();

        // if the searchSource doesn't know, tell it so
        if (!angular.equals(sort, currentSort)) $scope.fetch();
      });

      // update data source when filters update
      $scope.$listen(queryFilter, 'update', function () {
        return $scope.updateDataSource().then(function () {
          $state.save();
        });
      });

      // update data source when hitting forward/back and the query changes
      $scope.$listen($state, 'fetch_with_changes', function (diff) {
        if (diff.indexOf('query') >= 0) $scope.fetch();
      });

      // fetch data when filters fire fetch event
      $scope.$listen(queryFilter, 'fetch', $scope.fetch);

      $scope.$watch('opts.timefield', function (timefield) {
        timefilter.enabled = !!timefield;
      });

      $scope.$watch('state.interval', function (interval, oldInterval) {
        if (interval !== oldInterval && interval === 'auto') {
          $scope.showInterval = false;
        }
        $scope.fetch();
      });

      $scope.$watch('vis.aggs', function () {
        // no timefield, no vis, nothing to update
        if (!$scope.opts.timefield) return;

        const buckets = $scope.vis.aggs.bySchemaGroup.buckets;

        if (buckets && buckets.length === 1) {
          $scope.intervalName = 'by ' + buckets[0].buckets.getInterval().description;
        } else {
          $scope.intervalName = 'auto';
        }        
      });

      $scope.$watchMulti([
        'rows',
        'fetchStatus'
      ], (function updateResultState() {
        let prev = {};
        const status = {
          LOADING: 'loading', // initial data load
          READY: 'ready', // results came back
          NO_RESULTS: 'none' // no results came back
        };

        function pick(rows, oldRows, fetchStatus) {
          // initial state, pretend we are loading
          if (rows == null && oldRows == null) return status.LOADING;

          const rowsEmpty = _.isEmpty(rows);
          // An undefined fetchStatus means the requests are still being
          // prepared to be sent. When all requests are completed,
          // fetchStatus is set to null, so it's important that we
          // specifically check for undefined to determine a loading status.
          const preparingForFetch = _.isUndefined(fetchStatus);
          if (preparingForFetch) return status.LOADING;
          else if (rowsEmpty && fetchStatus) return status.LOADING;
          else if (!rowsEmpty) return status.READY;
          else return status.NO_RESULTS;
        }

        return function () {
          const current = {
            rows: $scope.rows,
            fetchStatus: $scope.fetchStatus
          };

          $scope.resultState = pick(
            current.rows,
            prev.rows,
            current.fetchStatus,
            prev.fetchStatus
          );

          prev = current;
        };
      }()));

      $scope.searchSource.onError(function (err) {
        notify.error(err);
      }).catch(notify.fatal);

      function initForTime() {
        return setupVisualization().then($scope.updateTime);
      }

      return Promise.resolve($scope.opts.timefield && initForTime())
      .then(function () {
        init.complete = true;
        $state.replace();
        $scope.$emit('application.load');
      });
    });
  });

  $scope.opts.saveDataSource = function () {
    return $scope.updateDataSource()
    .then(function () {
      savedSearch.id = savedSearch.title;
      savedSearch.columns = $scope.state.columns;
      savedSearch.sort = $scope.state.sort;
      //savedSearch.pageSize = $scope.opts.sampleSize;
      savedSearch.uiConf.pageSize = $scope.opts.sampleSize;
      savedSearch.uiConf.advancedSearchBool = $TeldState.advancedSearchBool;
      teldSession.setSavedObjOwner(savedSearch);

      if ($scope.indexPattern.hasTimeField()) {
        let uiConf_timefilter = { disabled: false, timeFrom: timefilter.time.from, timeTo: timefilter.time.to };
        //uiConf_timefilter.refreshInterval = _.pick(timefilter.refreshInterval, ['display', 'pause', 'section', 'value']);

        savedSearch.uiConf.timefilter = angular.toJson(uiConf_timefilter);
      }
      return savedSearch.save()
      .then(function (id) {
        stateMonitor.setInitialState($state.toJSON());
        $scope.kbnTopNav.close('save');

        if (id) {
          notify.info('Saved Data Source "' + savedSearch.title + '"');
          if (savedSearch.id !== $route.current.params.id) {
            kbnUrl.change('/discover/{{id}}', { id: savedSearch.id });
          } else {
            // Update defaults so that "reload saved query" functions correctly
            $state.setDefaults(getStateDefaults());
          }
        }
      });
    })
    .catch(notify.error);
  };

  $scope.opts.fetch = $scope.fetch = function () {
    // ignore requests to fetch before the app inits
    if (!init.complete) return;

    $scope.updateTime();

    $scope.updateDataSource()
    .then(setupVisualization)
    .then(function () {
      $state.save();
      $TeldState.save();
      $scope.kbnTopNav.close();
      return courier.fetch();
    })
    .catch(notify.error);
  };

  $scope.searchSource.onBeginSegmentedFetch(function (segmented) {

    function flushResponseData() {
      $scope.hits = 0;
      $scope.faliures = [];
      $scope.rows = [];
      $scope.fieldCounts = {};
    }

    if (!$scope.rows) flushResponseData();

    const sort = $state.sort;
    const timeField = $scope.indexPattern.timeFieldName;
    const totalSize = $scope.size || $scope.opts.sampleSize;

    /**
     * Basically an emum.
     *
     * opts:
     *   "time" - sorted by the timefield
     *   "non-time" - explicitly sorted by a non-time field, NOT THE SAME AS `sortBy !== "time"`
     *   "implicit" - no sorting set, NOT THE SAME AS "non-time"
     *
     * @type {String}
     */
    const sortBy = (function () {
      if (!_.isArray(sort)) return 'implicit';
      else if (sort[0] === '_score') return 'implicit';
      else if (sort[0] === timeField) return 'time';
      else return 'non-time';
    }());

    let sortFn = null;
    if (sortBy !== 'implicit') {
      sortFn = new HitSortFn(sort[1]);
    }

    $scope.updateTime();
    if (sort[0] === '_score') segmented.setMaxSegments(1);
    segmented.setDirection(sortBy === 'time' ? (sort[1] || 'desc') : 'desc');
    segmented.setSortFn(sortFn);
    segmented.setSize($scope.opts.sampleSize);

    // triggered when the status updated
    segmented.on('status', function (status) {
      $scope.fetchStatus = status;
    });

    segmented.on('first', function () {
      flushResponseData();
    });

    segmented.on('segment', notify.timed('handle each segment', function (resp) {
      if (resp._shards.failed > 0) {
        $scope.failures = _.union($scope.failures, resp._shards.failures);
        $scope.failures = _.uniq($scope.failures, false, function (failure) {
          return failure.index + failure.shard + failure.reason;
        });
      }
    }));

    segmented.on('mergedSegment', function (merged) {
      $scope.mergedEsResp = merged;
      $scope.hits = merged.hits.total;

      const indexPattern = $scope.searchSource.get('index');

      // the merge rows, use a new array to help watchers
      $scope.rows = merged.hits.hits.slice();

      notify.event('flatten hit and count fields', function () {
        let counts = $scope.fieldCounts;

        // if we haven't counted yet, or need a fresh count because we are sorting, reset the counts
        if (!counts || sortFn) counts = $scope.fieldCounts = {};

        $scope.rows.forEach(function (hit) {
          // skip this work if we have already done it
          if (hit.$$_counted) return;

          // when we are sorting results, we need to redo the counts each time because the
          // "top 500" may change with each response, so don't mark this as counted
          if (!sortFn) hit.$$_counted = true;

          const fields = _.keys(indexPattern.flattenHit(hit));
          let n = fields.length;
          let field;
          while (field = fields[--n]) {
            if (counts[field]) counts[field] += 1;
            else counts[field] = 1;
          }
        });
      });
    });

    segmented.on('complete', function () {
      if ($scope.fetchStatus.hitCount === 0) {
        flushResponseData();
      }

      $scope.fetchStatus = null;
    });
  }).catch(notify.fatal);

  $scope.updateTime = function () {
    $scope.timeRange = {
      from: dateMath.parse(timefilter.time.from),
      to: dateMath.parse(timefilter.time.to, true)
    };
  };

  $scope.resetQuery = function () {
    kbnUrl.change('/discover/{{id}}', { id: $route.current.params.id });
  };

  $scope.newQuery = function () {
    kbnUrl.change('/discover');
  };

  $scope.updateDataSource = Promise.method(function () {
    //savedSearch.uiConf.advancedSearchBool = advancedSearch.syncAdvancedSearch($scope.advancedSearch);
    $TeldState.advancedSearchBool = advancedSearch.syncAdvancedSearch($scope.advancedSearch);
    $TeldState.save();
    let esQueryDSL = advancedSearch.syncAdvancedSearch2EsQueryDSL($scope.advancedSearch);

    //debugger;
    $scope.searchSource
      .size($scope.opts.sampleSize)
      .sort(getSort($state.sort, $scope.indexPattern)).query(!$state.query ? null : $state.query)
      .set('filter', queryFilter.getFilters())
      .set('advancedSearch', esQueryDSL);

    //$scope.advancedSearch = advancedSearch2UiBind(temp, advancedSearch.getFieldSource($scope.indexPattern));

    if (config.get('doc_table:highlight')) {
      $scope.searchSource.highlight({
        pre_tags: [highlightTags.pre],
        post_tags: [highlightTags.post],
        fields: {'*': {}},
        require_field_match: false,
        fragment_size: 2147483647 // Limit of an integer.
      });
    }
  });

  // TODO: On array fields, negating does not negate the combination, rather all terms
  $scope.filterQuery = function (field, values, operation) {
    $scope.indexPattern.popularizeField(field, 1);
    filterManager.add(field, values, operation, $state.index);
  };

  $scope.toTop = function () {
    $window.scrollTo(0, 0);
  };

  let loadingVis;
  function setupVisualization() {
    // If we're not setting anything up we need to return an empty promise
    if (!$scope.opts.timefield) return Promise.resolve();
    if (loadingVis) return loadingVis;

    const visStateAggs = [
      {
        type: 'count',
        schema: 'metric'
      },
      {
        type: 'date_histogram',
        schema: 'segment',
        params: {
          field: $scope.opts.timefield,
          interval: $state.interval
        }
      }
    ];

    // we have a vis, just modify the aggs
    if ($scope.vis) {
      const visState = $scope.vis.getEnabledState();
      visState.aggs = visStateAggs;

      $scope.vis.setState(visState);
      return Promise.resolve($scope.vis);
    }

    $scope.vis = new Vis($scope.indexPattern, {
      title: savedSearch.title,
      type: 'histogram',
      params: {
        addLegend: false,
        addTimeMarker: true
      },
      listeners: {
        click: function (e) {
          notify.log(e);
          timefilter.time.from = moment(e.point.x);
          timefilter.time.to = moment(e.point.x + e.data.ordered.interval);
          timefilter.time.mode = 'absolute';
        },
        brush: brushEvent($scope.state)
      },
      aggs: visStateAggs
    });

    $scope.searchSource.aggs(function () {
      $scope.vis.requesting();
      return $scope.vis.aggs.toDsl();
    });

    // stash this promise so that other calls to setupVisualization will have to wait
    loadingVis = new Promise(function (resolve) {
      $scope.$on('ready:vis', function () {
        resolve($scope.vis);
      });
    })
    .finally(function () {
      // clear the loading flag
      loadingVis = null;
    });

    return loadingVis;
  }

  function resolveIndexPatternLoading() {
    const props = $route.current.locals.ip;
    const loaded = props.loaded;
    const stateVal = props.stateVal;
    const stateValFound = props.stateValFound;

    const own = $scope.searchSource.getOwn('index');

    if (own && !stateVal) return own;
    if (stateVal && !stateValFound) {
      const err = '"' + stateVal + '" is not a configured pattern. ';
      if (own) {
        notify.warning(err + ' Using the saved index pattern: "' + own.id + '"');
        return own;
      }

      notify.warning(err + ' Using the default index pattern: "' + loaded.id + '"');
    }
    return loaded;
  }

  $scope.test=function () {
    /** debugger; */

    /*在方法中 this===$scope 成立*/
    /*
    * 可以通过修改$scope中对应的属性后，
    * scope.fetch()调用$state.save();触发查询。该方法会将查询的条件序列化到URL中，序列化的方式使用的是 rison.encode(state) ，https://github.com/Nanonid/rison
    * $state 为状态控制对象，src/ui/public/state_management/state.js  =》 StateProvider
    *   src/core_plugins/kibana/public/discover/controllers/discover.js@158
    *   const $state = $scope.state = new AppState(getStateDefaults());
    *   AppState集成state _.class(AppState).inherits(State);
    * */

    alert(this.timefilter.time.from);
    this.timefilter.time.from = 'now-30d';
    alert(this === $scope);
    $state.save();
    //或$scope.fetch() 详细分析见http://www.cnblogs.com/xing901022/p/5158425.html
  }

  $scope.export = function(){
    let indexPattern = $scope.indexPattern;
    let columns = $scope.state.columns;
    discoverExportExcel(indexPattern,columns,savedSearch,$scope.rows);
  }

  const requestQueue = Private(RequestQueueProvider);
  // const isRequest = Private(IsRequestProvider);
  // const mergeDuplicateRequests = Private(MergeDuplicatesRequestProvider);
  const callClientExport = Private(require('ui/courier/fetch/call_client_export'));
  const forEachStrategy = Private(require("ui/courier/fetch/for_each_strategy"));
  const ABORTED = { CourierFetchRequestStatus: 'aborted' };

  $scope.callNodejs=function () {

    /** debugger; */
    // $scope.searchSource 拼接查询条件的数据
    // alert($scope.searchSource._fetchStrategy);
    // alert($scope.searchSource._fetchStrategy.reqsFetchParamsToBody);

    const requests = requestQueue.getStartable($scope.searchSource._fetchStrategy);

    function startRequests(requests) {
      return Promise.map(requests, function (req) {
        //return req;
        return new Promise(function (resolve) {
          const action = req.started ? req.continue : req.start;
          resolve(action.call(req));
        })
          .catch(err => {
            console.log(err);
          });
      });
    }

    function fetchWithStrategy(strategy, requests) {
      function replaceAbortedRequests() {
        requests = requests.map(r => r.aborted ? ABORTED : r);
      }

      replaceAbortedRequests();
      return startRequests(requests)
      .then(function () {
        replaceAbortedRequests();
        return callClientExport(strategy, requests);
      })
    }

    let ooo = forEachStrategy(requests, function (strategy, reqsForStrategy) {
      return fetchWithStrategy(strategy, reqsForStrategy.map(function (req) {
        if (!req.started) return req;
        return req.retry();
      }));
    })
      .catch(notify.fatal);

    /** debugger; */
    let reqsFetchParams = [
      {
        index: ['logstash-123'],
        type: 'blah',
        search_type: 'blah2',
        body: { foo: 'bar', $foo: 'bar' }
      }
    ];
    /** debugger; */
    let value;
    $scope.searchSource._fetchStrategy.reqsFetchParamsToBody(reqsFetchParams)
      .then(val => {
        value = val;
        console.log(value);
      });

    // let url = "/elasticsearch/export/_msearch";
    // let data = '{"index":["系统运行日志"],"ignore_unavailable":true,"preference":1486962061082}\r\n{"highlight":{"pre_tags":["@kibana-highlighted-field@"],"post_tags":["@/kibana-highlighted-field@"],"fields":{"*":{}},"require_field_match":false,"fragment_size":2147483647},"query":{"bool":{"must":[{"query_string":{"query":"*","analyze_wildcard":true}},{"range":{"CreateTime":{"gte":1486961615159,"lte":1486962515159,"format":"epoch_millis"}}}],"must_not":[]}},"size":500,"sort":[{"_score":{"order":"desc"}}],"_source":{"excludes":[]},"aggs":{"2":{"date_histogram":{"field":"CreateTime","interval":"30s","time_zone":"Asia/Shanghai","min_doc_count":1}}},"stored_fields":["*"],"script_fields":{},"docvalue_fields":["CreateTime"]}\r\n';
    // $http.post(url, data)
    //   .then(function successCallback(response) {
    //     console.log(response);
    //     // this callback will be called asynchronously
    //     // when the response is available
    //   }, function errorCallback(response) {
    //     /** debugger; */
    //     // called asynchronously if an error occurs
    //     // or server returns response with an error status.
    //   });
  }

  init();
};
