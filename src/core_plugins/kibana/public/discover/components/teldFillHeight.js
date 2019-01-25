import _ from 'lodash';
import $ from 'jquery';
import uiModules from 'ui/modules';
import 'fixed-header-table/jquery.fixedheadertable';
import { debug } from 'util';
const app = uiModules.get('apps/discover');

app.directive('teldSidebarListFillHeight', function () {
  return {
    restrict: 'A',
    scope: {
      more: '='
    },
    link: function ($scope, $element) {
      $scope.$watch(function () { return $element.offset().top; }, function (top) {
        $element.css({ 'overflow-y': 'scroll', 'height': `calc(100vh - ${top}px)` });
      });
    }
  };
});

app.directive('teldFillHeight', function () {
  return {
    restrict: 'A',
    scope: {
      more: '=',
      din: '='
    },
    link: function ($scope, $element) {
      $scope.$watch('din', function (n, o) {
        if (n) {
          $element.closest('#kibana-body').css('overflow-y', 'hidden');
          $element.css({ 'height': `calc(100vh - ${top + 25}px)` });
        } else {
          $element.closest('#kibana-body').css('overflow-y', '');
          $element.css('height', '');
        }
      });
      if (false === $scope.din) {
        return;
      }

      $scope.$watch(function () { return $element.offset().top; }, function (top) {
        $element.css({ 'height': `calc(100vh - ${top + 25}px)` });
      });

      $scope.$on('$destroy', function () {
        $element.closest('#kibana-body').css('overflow-y', '');
      });
    }
  };
});

app.directive('teldFixedHeaderTable', function ($compile) {
  return {
    restrict: 'A',
    scope: {
      more: '=',
      list: '=',
      din: '='
    },
    link: function ($scope, $element) {
      let checkTimer;
      let scheduleCheck;
      let listener;
      debugger;
      listener = $scope.$on('fixedHeaderTableRefresh', function (event, data) {
        //alert($scope.din);
        if ($scope.din) {
          setTimeout(setup, 0);
        }
      });
      $scope.fillHeight = $element.closest('[teld-fill-height]');
      $scope.$watch('din', function (n, o) {
        if (n) {
          setTimeout(setup, 0);
        } else {
          clearTimeout(checkTimer);
          $element.off('scroll', scheduleCheck);
          $element.fixedHeaderTable('destroy');
        }
      });
      $scope.$watch(function () { return $scope.fillHeight.offset().top; }, function (n, o) {
        if ($scope.din) setup();
      });
      if (false === $scope.din) {
        return;
      }
      $scope.$watch(function () { return $scope.list; }, function (n, o) {
        setTimeout(setup, 0);
      });

      function setup() {
        var pHeight = $scope.fillHeight.height();
        $element.fixedHeaderTable('destroy');
        if ($element.height() >= pHeight) {
          fixedHeaderTable();
        }
      }

      function fixedHeaderTable() {
        $element.fixedHeaderTable({ footer: false, cloneHeadToFoot: false, fixedColumn: false });

        var $tbody = $element.closest('.fht-tbody');
        var $thead = $element.parents('.fht-table-wrapper').find('.fht-thead');
        debugger;

        var head = $thead.find('thead').html();
        var h = head.replace('ng-if="indexPattern.timeFieldName"', '')
          .replace(/ng-repeat/g, 'ngRepeat');
        var $h = $(h);

        var ngClikcFun = function () {
          var tr = $(this).closest('tr');
          var ths = tr.find('th');
          var th = $(this).closest('th');
          var index = ths.index($(this).closest('th'));

          var tabWrapper = $(this).closest('.fht-table-wrapper');
          var eventTH = tabWrapper.find('.fht-tbody thead th:eq(' + index + ')');
          var ngClikc = $(this).attr('ng-click');
          eventTH.find('[ng-click="' + ngClikc + '"]').click();

          setTimeout(function () { setup(); }, 0);
        };

        $h.find('[ng-click]').click(ngClikcFun);
        $thead.find('thead').html($h);


        $tbody.css('overflow', 'scroll')
          .css('height', $(window).height() - $tbody.offset().top);

        var onScroll = function () {
          //alert(1);
          if (!$scope.more) return;
          let height = $tbody.height();
          let scrollTop = $tbody.scrollTop();
          let scrollHeight = $tbody.prop('scrollHeight');
          if (scrollHeight <= (height + scrollTop)) {
            $scope[$scope.$$phase ? '$eval' : '$apply'](function () {
              let more = $scope.more();
            });
          }
        };

        scheduleCheck = function () {
          if (checkTimer) return;
          checkTimer = setTimeout(function () {
            checkTimer = null;
            onScroll();
          }, 50);
        };

        $tbody.on('scroll', scheduleCheck);
        scheduleCheck();
      }

      $scope.$on('$destroy', function () {
        clearTimeout(checkTimer);
        $element.off('scroll', scheduleCheck);
        $element.fixedHeaderTable('destroy');
        if (listener) {
          listener();
          listener = null;
        }
      });
    }
  };
});

app.directive('goToConfig', function () {
  return {
    restrict: 'E',
    scope: {
      target: '@'
    },
    template: '<a style="margin-left:6px;" ng-href="{{href}}"><i class="fa fa-reply" aria-hidden="true"></i></a>',
    link: function ($scope, $element) {
      $scope.referrer = document.referrer;
      $scope.href = `/app/kibana#/management/kibana/objects?_a=(tab:${$scope.target})`;
      if (window !== window.top || false === _.isEmpty(document.referrer)) {
        $element.find('i').hide();
      }
    }
  };
});
