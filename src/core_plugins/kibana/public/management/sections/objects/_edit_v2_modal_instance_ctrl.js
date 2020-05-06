import _ from 'lodash';
import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';

uiModules.get('apps/management')
  .controller('ModalInstanceStrategyEditorCtrl', function ($scope, $modalInstance, strategy, strategyConf) {

    $scope.aceLoaded = function (editor) {
      // if (_.contains(loadedEditors, editor)) return;
      // loadedEditors.push(editor);

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

    $scope.setCurrent = function (conf) {
      $scope.current = conf;
    };

    $scope.add = function (itemArray) {
      debugger;
      switch ($scope.strategy.key) {
        case "ranges":
        case "thresholds":
        case "enumeration":
          if ($scope.current === undefined || $scope.current['strategy'] === undefined) {
            $scope.current = {
              "bgColor": false,
              "strategy": $scope.strategy.key,
              "strategyKey": $scope.strategy.key,
              "strategyName": $scope.strategy.name,
            };
            $scope.current[$scope.strategy.key] = [];
            itemArray.push($scope.current);
          }
          $scope.current[$scope.strategy.key].push({});
          break;
        default:
          $scope.current = {
            "bgColor": false,
            "strategy": $scope.strategy.key,
            "strategyKey": $scope.strategy.key,
            "strategyName": $scope.strategy.name,
          };
          itemArray.push($scope.current);
          break;
      }
    }
    $scope.remove = function (itemArray, index) {
      $scope.setCurrent(itemArray[index - 1]);
      itemArray.splice(index, 1);
    }

    $scope.ok = function () {
      // $modalInstance.close($scope.current);
      $modalInstance.close($scope.strategyConf);
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };

    debugger;
    // $scope.current = {};
    $scope.strategy = strategy;
    $scope.strategyConf = strategyConf;
    if (_.size($scope.strategyConf) === 0) {
      $scope.add($scope.strategyConf);
    } else {
      $scope.current = _.first($scope.strategyConf);
    }
    // $scope.current = $scope.strategyConf[0];
  })
  .controller('ModalInstanceCtrl', function ($scope, $modalInstance, options) {
    debugger;
    $scope.options = options;

    $scope.ok = function () {
      $modalInstance.close();
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  });
