import uiModules from 'ui/modules';
import indexHeaderTemplate from 'plugins/kibana/management/sections/indices/_index_header.html';
import objectEditOnlineHTML from 'plugins/kibana/management/sections/objects/_edit_v2_online.html';
uiModules
.get('apps/management')
.directive('kbnManagementIndexHeader', function (config, $location, $modal) {
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

      $scope.newDiscoverModal = function () {
        debugger;
        // kbnUrl.change("/discover/" + $routeParams.id);

        var modalInstance = $modal.open({
          // templateUrl: "myModalContent.html",
          template: objectEditOnlineHTML,
          controller: 'ModalInstanceIndexSearchCtrl',
          windowClass: 'modal-class',
          size: 'lg',
          resolve: {
            options: function () {
              return {
                iframeUrl: `/app/kibana#/discover?_a=(index:'${$scope.indexPattern.id}',query:(query_string:(query:'*')))`
              };
            }
          }
        });
        modalInstance.opened.then(function () {// 模态窗口打开之后执行的函数
          console.log('modal is opened');
        });
        modalInstance.result.then(function (result) {
          debugger;
          console.log(result);
          if (result.title && result.title != "New Saved Search") {
            // $location.path(`/discover/" + ${result.title}`);
            $location.path(`/management/kibana/objects/edit_v2/savedSearches/${result.title}`);
          }
        }, function (reason) {
          console.log(reason);// 点击空白区域，总会输出backdrop
          // click，点击取消，则会暑促cancel
          // $log.info('Modal dismissed at: ' + new Date());
        });
      };

      $scope.newDiscover = function () {
        //$location.path('/app/kibana#/discover?_a=(index:bdpdrlogictable,query:(query_string:(query:\'*\')))');
        var id = this.indexPattern.id;
        if (window.top !== window) {
          $scope.newDiscoverModal();
        } else {
          $location.path('/discover').search({ _a: `(index:'${this.indexPattern.id}',query:(query_string:(query:'*')))` });
          //$location.path('/app/kibana#/discover?_a=(index:bdpdrlogictable,query:(query_string:(query:\'*\')))');
        }
      };
      config.bindToScope($scope, 'defaultIndex');
    }
  };
})
.controller('ModalInstanceIndexSearchCtrl', function ($scope, $modalInstance, options) {
  debugger;
  $scope.options = options;

  $scope.ok = function () {
    debugger;
    var returnValue = {};
    var currentIframe = $("iframe")[0];
    if (currentIframe) {
      var currentDoc = currentIframe.contentDocument || currentIframe.contentWindow.document
      returnValue.title = $(currentDoc).find('span[ng-bind="::opts.savedSearch.title"]').html();
    }
    $modalInstance.close(returnValue);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
});;
