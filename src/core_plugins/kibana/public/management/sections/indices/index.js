import management from 'ui/management';
import 'plugins/kibana/management/sections/indices/_create';
import 'plugins/kibana/management/sections/indices/_edit';
import 'plugins/kibana/management/sections/indices/_field_editor';
import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';
import indexTemplate from 'plugins/kibana/management/sections/indices/index.html';

const indexPatternsResolutions = {
  indexPatternIds: function (courier) {
    return courier.indexPatterns.getIdsTeld();
  }
};

// add a dependency to all of the subsection routes
uiRoutes
.defaults(/management\/kibana\/indices/, {
  resolve: indexPatternsResolutions
});

uiRoutes
.defaults(/management\/kibana\/index/, {
  resolve: indexPatternsResolutions
});

// wrapper directive, which sets some global stuff up like the left nav
uiModules.get('apps/management')
  .directive('kbnManagementIndices', function ($route, $location,  config, kbnUrl) {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      sectionName: '@section'
    },
    template: indexTemplate,
    link: function ($scope) {
      $scope.editingId = $route.current.params.indexPatternId;
      config.bindToScope($scope, 'defaultIndex');

      $scope.allowNewIndex = window.top == window;

      $scope.$watch('defaultIndex', function () {
        const ids = $route.current.locals.indexPatternIds;
        debugger;
        $scope.indexPatternList = ids.map(function (id) {
          return {
            id: id,
            url: kbnUrl.eval('#/management/kibana/indices/{{id}}', {id: id}),
            class: 'sidebar-item-title ' + ($scope.editingId === id ? 'active' : ''),
            default: $scope.defaultIndex === id
          };
        });
      });

      $scope.$emit('application.load');
    }
  };
});

uiModules.get('apps/management')
  .controller('managementSection', function ($scope, $location, $route, config, courier, Notifier, Private, AppState, docTitle) {

    $scope.sectionName = "kibana";
    $scope.sections = management.items.inOrder;
    $scope.section = management.getSection($scope.sectionName) || management;

    if ($scope.section) {
      $scope.section.items.forEach(item => {
        item.active = `#${$location.path()}`.indexOf(item.url) > -1;
      });
    }
  });


/***/
//2017-02-23@管理页面中隐藏
management.getSection('kibana').register('indices', {
  display: '数据模型',
  order: 0,
  url: '#/management/kibana/indices/'
});
