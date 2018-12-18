import _ from 'lodash';
import uiModules from 'ui/modules';
const app = uiModules.get('apps/discover');

app.directive('teldFillHeight', function () {
  return {
    restrict: 'A',
    scope: {
      more: '='
    },
    link: function ($scope, $element) {
      $element.closest('#kibana-body').css('overflow-y', 'hidden');
      $scope.$watch(function () { return $element.offset().top; }, function (top) {
        //var offset = $element.offset();
        $element.css({ 'overflow-y': 'scroll', 'height': `calc(100vh - ${top}px)` });
      });

      let checkTimer;

      function onScroll() {
        if (!$scope.more) return;
        let height = $element.height();
        let scrollTop = $element.scrollTop();
        let scrollHeight = $element.prop('scrollHeight');
        if (scrollHeight <= (height + scrollTop)) {
          $scope[$scope.$$phase ? '$eval' : '$apply'](function () {
            let more = $scope.more();
          });
        }

        // let winHeight = $window.height();
        // let winBottom = winHeight + $window.scrollTop();
        // let elTop = $element.offset().top;
        // let remaining = elTop - winBottom;
        // if (remaining <= winHeight * 0.50) {
        //   $scope[$scope.$$phase ? '$eval' : '$apply'](function () {
        //     let more = $scope.more();
        //   });
        // }
      }

      function scheduleCheck() {
        if (checkTimer) return;
        checkTimer = setTimeout(function () {
          checkTimer = null;
          onScroll();
        }, 50);
      }

      $element.on('scroll', scheduleCheck);
      scheduleCheck();

      $scope.$on('$destroy', function () {
        clearTimeout(checkTimer);
        $element.off('scroll', scheduleCheck);
        $element.closest('#kibana-body').css('overflow-y','');
      });
    }
  };
});
