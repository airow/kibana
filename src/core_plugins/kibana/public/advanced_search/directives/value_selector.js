import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import valueSelectorTemplate from './value_selector.html';
import valueSelectorModalTemplate from './value_selector_modal.html';
import '../styles/advanced_search.css'
import uiModules from 'ui/modules';
import '../services/value_selector_service';

uiModules
.get('apps/advanced_search')
.directive('teldValueSelector', function (Private, $compile, $modal, courier, valueSelectorService) { 

    return {
        restrict: 'E',
        template: valueSelectorTemplate,/** 不能使用这种方式 */
        scope: {
            //indexPattern: '=',
            field: '=',
            selected: '='
        },
        controller: function ($scope) {

            let dataSources = $scope.dataSources = (function () {
                let returnValue = [
                    { key: "A01", Code: '11', Name: '111' },
                    { key: "A01", Code: '11', Name: '111' },
                    { key: "A01", Code: '11', Name: '111' }
                ];

                return returnValue;
            })();

            $scope.open = function (size) {
                var modalInstance = $modal.open({
                    templateUrl: valueSelectorTemplate,
                    controller: 'teldValueSelectorModalInstanceCtrl',
                    size: size,
                    resolve: {
                        items: function () {
                            return $scope.dataSources;
                        }
                    }
                });

                modalInstance.result.then(function (selectedItem) {
                    $scope.selected = selectedItem;
                }, function () {
                    $log.info('Modal dismissed at: ' + new Date());
                });
            };
        },
        link: function ($scope, element) {

        }
    };
})
.controller('teldValueSelectorModalInstanceCtrl', function ($scope, $modalInstance, items) {

  $scope.items = items;
  $scope.selected = {
    item: $scope.items[0]
  };

  $scope.ok = function () {
    $modalInstance.close($scope.selected.item);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
});