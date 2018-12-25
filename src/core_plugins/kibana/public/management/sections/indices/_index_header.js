import uiModules from 'ui/modules';
import indexHeaderTemplate from 'plugins/kibana/management/sections/indices/_index_header.html';
uiModules
.get('apps/management')
.directive('kbnManagementIndexHeader', function (config, $location) {
  return {
    restrict: 'E',
    template: indexHeaderTemplate,
    scope: {
      indexPattern: '=',
      setDefault: '&',
      refreshFields: '&',
      delete: '&'
    },
    link: function ($scope, $el, attrs) {
      $scope.delete = attrs.delete ? $scope.delete : null;
      $scope.setDefault = attrs.setDefault ? $scope.setDefault : null;
      $scope.refreshFields = attrs.refreshFields ? $scope.refreshFields : null;
      $scope.newDiscover = function () {
        //$location.path('/app/kibana#/discover?_a=(index:bdpdrlogictable,query:(query_string:(query:\'*\')))');
        var id = this.indexPattern.id;
        $location.path('/discover').search({ _a: `(index:'${this.indexPattern.id}',query:(query_string:(query:'*')))` });
        //$location.path('/app/kibana#/discover?_a=(index:bdpdrlogictable,query:(query_string:(query:\'*\')))');
      };
      config.bindToScope($scope, 'defaultIndex');
    }
  };
});
