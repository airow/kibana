import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import valueSelectorTemplate from './value_selector.html';
import valueSelectorModalTemplate from './value_selector_modal.html';
import valueSelectorModalTreeTemplate from './value_selector_modal_tree.html';
import '../styles/advanced_search.css'
import uiModules from 'ui/modules';
import '../services/value_selector_service';
import 'angular-grid-tree';

uiModules
.get('apps/advanced_search')
.directive('teldValueSelector', function (Private, $compile, $modal, $log, courier, valueSelectorService) { 

    return {
        restrict: 'E',
        template: valueSelectorTemplate,/** 不能使用这种方式 */
        scope: {
            //indexPattern: '=',
            field: '=',
            selected: '='
        },
        controller: function ($scope) {
            if ($scope.field.selectable) {
                valueSelectorService.getDataSources($scope.field).then(function (data) {
                    $scope.dataSources = data;
                });
            }

            $scope.open = function (size) {
                if ($scope.field.selectable) {
                    if ($scope.field.selectConf.isTree) {
                        $scope.openTree(size);
                    } else {
                        $scope.openList(size);
                    }
                }
            };

            $scope.openList = function (size) {
                var modalInstance = $modal.open({
                    template: valueSelectorModalTemplate,
                    controller: 'teldValueSelectorModalInstanceCtrl',
                    size: size,
                    resolve: {
                        items: function () {
                            return $scope.dataSources;
                        }
                    }
                });

                modalInstance.result.then(function (selectedItem) {
                    let defalutKey = "code";
                    let valueKey = $scope.field.selectConf.valueKey || defalutKey;
                    if (!selectedItem[valueKey]) {
                        valueKey = defalutKey;
                    }
                    $scope.selected = selectedItem[valueKey];

                }, function () {
                    $log.info('Modal dismissed at: ' + new Date());
                });
            };

            $scope.openTree = function (size) {
                var modalInstance = $modal.open({
                    template: valueSelectorModalTreeTemplate,
                    controller: 'teldValueSelectorModalInstanceTreeCtrl',
                    size: size,
                    resolve: {
                        items: function () {
                            return $scope.dataSources;
                        },
                        current: function () {
                            return { field: $scope.field, value: $scope.selected };
                        }
                    }
                });

                modalInstance.result.then(function (selectedItem) {
                    let defalutKey = "code";
                    let valueKey = $scope.field.selectConf.valueKey || defalutKey;
                    if (!selectedItem[valueKey]) {
                        valueKey = defalutKey;
                    }
                    $scope.selected = selectedItem[valueKey];

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
    item: {}
  };

  $scope.filterString = '';

  $scope.ok = function () {
    $modalInstance.close($scope.selected.item);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
})
.controller('teldValueSelectorModalInstanceTreeCtrl', function ($scope, $modalInstance, valueSelectorService, items, current) {    
    $scope.field = current.field;
    $scope.tree_data = valueSelectorService.getTreeForDueToAnalysis(_.cloneDeep(items), "id", "pid");
    $scope.expanding_property = {
        field: "code",
        displayName: "编码",
        //sortable: true,
        filterable: true,
        cellTemplate: "<i>{{row.branch[expandingProperty.field]}}</i>"
    };
    $scope.col_defs = [
        {
            field: "value",
            displayName: "值",
            //sortable: true,
            filterable: true
        }
    ];

    let selected = $scope.selected = {
        item: {}
    };
    selected.item[current.field.selectConf.valueKey] = current.value;
    //$scope.filterString = current.value;
    let treeControl = $scope.treeControl = {};
    $scope.my_tree_handler = function (branch) {
        console.log('you clicked on', branch)
    }

    $scope.selectHandler = function (branch) {
        if (!branch.children || branch.children.length === 0) {
            selected.item = branch;
        } else {
            if (!branch.expanded) { treeControl.expand_branch(branch); }
            selected.item = branch;
        }
    }

    $scope.ok = function () {
        $modalInstance.close($scope.selected.item);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
})
.filter('teldValueSelectorSearchFor', function () {
    return function (arr, filterString, expandingProperty, colDefinitions, expand) {
        var filtered = [];
        //only apply filter for strings 3 characters long or more
        if (!filterString || filterString.length < 0) {
            for (var i = 0; i < arr.length; i++) {
                var item = arr[i];
                if (item.visible) {
                    filtered.push(item);
                }
            }
        } else {
            var ancestorStack = [];
            var currentLevel = 0;
            for (var i = 0; i < arr.length; i++) {
                var item = arr[i];
                while (currentLevel >= item.level) {
                    var throwAway = ancestorStack.pop();
                    currentLevel--;
                }
                ancestorStack.push(item);
                currentLevel = item.level;
                if (include(item, filterString, expandingProperty, colDefinitions)) {
                    for (var ancestorIndex = 0; ancestorIndex < ancestorStack.length; ancestorIndex++) {
                        var ancestor = ancestorStack[ancestorIndex];
                        if (ancestor.visible) {
                            if (expand)
                                ancestor.branch.expanded = true;
                            filtered.push(ancestor);
                        }
                    }
                    ancestorStack = [];
                }
            }
        }
        return filtered;
    };

    function include(item, filterString, expandingProperty, colDefinitions) {
        var includeItem = false;
        var filterApplied = false;
        //first check the expandingProperty
        if (expandingProperty.filterable) {
            filterApplied = true;
            if (checkItem(item, filterString, expandingProperty)) {
                includeItem = true;
            }
        }
        //then check each of the other columns
        var arraySize = colDefinitions.length;
        for (var i = 0; i < arraySize; i++) {
            var col = colDefinitions[i];
            if (col.filterable) {
                filterApplied = true;
                if (checkItem(item, filterString, col)) {
                    includeItem = true;
                }
            }
        }
        if (filterApplied) {
            return includeItem;
        } else {
            return true;
        }
    }

    function checkItem(item, filterString, col) {
        if (col.sortingType === "number") {
            if (item.branch[col.field] != null
                && parseFloat(item.branch[col.field]) === parseFloat(filterString)) {
                return true;
            }
        } else {
            if (item.branch[col.field] != null
                && item.branch[col.field].toLowerCase().indexOf(filterString.toLowerCase()) !== -1) {
                return true;
            }
        }
    }
});