import $ from 'jquery';
import _ from 'lodash';
import uiModules from 'ui/modules';

const SCROLLER_HEIGHT = 20;

uiModules
.get('kibana')
.directive('fixedScroll2', function ($timeout) {
  return {
    restrict: 'A',
    link: function ($scope, $el) {
      let $window = $(window);
      let $scroller = $('<div class="fixed-scroll-scroller">').height(SCROLLER_HEIGHT);


      /**
       * Remove the listeners bound in listen()
       * @type {function}
       */
      let unlisten = _.noop;

      /**
       * Listen for scroll events on the $scroller and the $el, sets unlisten()
       *
       * unlisten must be called before calling or listen() will throw an Error
       *
       * Since the browser emits "scroll" events after setting scrollLeft
       * the listeners also prevent tug-of-war
       *
       * @throws {Error} If unlisten was not called first
       * @return {undefined}
       */
      function listen() {
        if (unlisten !== _.noop) {
          throw new Error('fixedScroll listeners were not cleaned up properly before re-listening!');
        }

        let blockTo;
        function bind($from, $to) {
          function handler() {
            if (blockTo === $to) return (blockTo = null);
            $to.scrollLeft((blockTo = $from).scrollLeft());
          }

          $from.on('scroll', handler);
          return function () {
            $from.off('scroll', handler);
          };
        }

        unlisten = _.flow(
          bind($el, $scroller),
          bind($scroller, $el),
          function () { unlisten = _.noop; }
        );
      }

      /**
       * Revert DOM changes and event listeners
       * @return {undefined}
       */
      function cleanUp() {
        unlisten();
        $scroller.detach();
        $el.css('padding-bottom', 0);
      }

      /**
       * Modify the DOM and attach event listeners based on need.
       * Is called many times to re-setup, must be idempotent
       * @return {undefined}
       */
      function setup() {
        cleanUp();

        const containerWidth = $el.width();
        const contentWidth = $el.prop('scrollWidth');
        const containerHorizOverflow = contentWidth - containerWidth;

        const elTop = $el.offset().top - $window.scrollTop();
        const elBottom = elTop + $el.height();
        const windowVertOverflow = elBottom - $window.height();

        const requireScroller = containerHorizOverflow > 0 && windowVertOverflow > 0;
        if (!requireScroller) return;

        // push the content away from the scroller
        $el.css('padding-bottom', SCROLLER_HEIGHT);

        // fill the scroller with a dummy element that mimics the content
        $scroller
        .width(containerWidth)
        .html($('<div>').css({ width: contentWidth, height: SCROLLER_HEIGHT }))
        .insertAfter($el);

        // listen for scroll events
        listen();

        //2017-03-26 结果集少，横向双滚动条
        //$el.css("overflow-x",'hidden');
      }

      // reset when the width or scrollWidth of the $el changes
      $scope.$watchMulti([
        function () { return $el.prop('scrollWidth'); },
        function () { return $el.width(); }
      ], setup);

      // cleanup when the scope is destroyed
      $scope.$on('$destroy', function () {
        cleanUp();
        $scroller = $window = null;
      });
    }
  };
});

uiModules
.get('kibana')
.directive('fixedScroll', function ($timeout) {
  return {
    restrict: 'A',
    link: function ($scope, $el) {
      let $window = $(window);
      let $scroller = $('<div class="fixed-scroll-scroller">').height(SCROLLER_HEIGHT);


      /**
       * Remove the listeners bound in listen()
       * @type {function}
       */
      let unlisten = _.noop;

      /**
       * Listen for scroll events on the $scroller and the $el, sets unlisten()
       *
       * unlisten must be called before calling or listen() will throw an Error
       *
       * Since the browser emits "scroll" events after setting scrollLeft
       * the listeners also prevent tug-of-war
       *
       * @throws {Error} If unlisten was not called first
       * @return {undefined}
       */
      function listen() {
        if (unlisten !== _.noop) {
          throw new Error('fixedScroll listeners were not cleaned up properly before re-listening!');
        }

        let blockTo;
        function bind($from, $to) {
          function handler() {
            if (blockTo === $to) return (blockTo = null);
            $to.scrollLeft((blockTo = $from).scrollLeft());
          }

          $from.on('scroll', handler);
          return function () {
            $from.off('scroll', handler);
          };
        }

        unlisten = _.flow(
          bind($el, $scroller),
          bind($scroller, $el),
          function () { unlisten = _.noop; }
        );
      }

      /**
       * Revert DOM changes and event listeners
       * @return {undefined}
       */
      function cleanUp() {
        unlisten();
        $scroller.detach();
        $el.css('padding-bottom', 0);
      }

      /**
       * Modify the DOM and attach event listeners based on need.
       * Is called many times to re-setup, must be idempotent
       * @return {undefined}
       */
      function setup() {
        cleanUp();

        const containerWidth = $el.width();
        const contentWidth = $el.prop('scrollWidth');
        const containerHorizOverflow = contentWidth - containerWidth;

        const elTop = $el.offset().top - $window.scrollTop();
        const elBottom = elTop + $el.height();
        const windowVertOverflow = elBottom - $window.height();

        const requireScroller = containerHorizOverflow > 0 && windowVertOverflow > 0;
        if (!requireScroller) return;

        // push the content away from the scroller
        $el.css('padding-bottom', SCROLLER_HEIGHT);

        // fill the scroller with a dummy element that mimics the content
        $scroller
        .width(containerWidth)
        .html($('<div>').css({ width: contentWidth, height: SCROLLER_HEIGHT }))
        .insertAfter($el);

        // listen for scroll events
        listen();

        //2017-03-26 结果集少，横向双滚动条
        //$el.css("overflow-x",'hidden');
      }

      // reset when the width or scrollWidth of the $el changes
      $scope.$watchMulti([
        function () { return $el.prop('scrollWidth'); },
        function () { return $el.width(); }
      ], setup);


      var browser = {
        versions: function () {
          var u = navigator.userAgent, app = navigator.appVersion;
          return {         //移动终端浏览器版本信息
            trident: u.indexOf('Trident') > -1, //IE内核
            presto: u.indexOf('Presto') > -1, //opera内核
            webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
            gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1, //火狐内核
            mobile: !!u.match(/AppleWebKit.*Mobile.*/), //是否为移动终端
            ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
            android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1, //android终端或uc浏览器
            iPhone: u.indexOf('iPhone') > -1, //是否为iPhone或者QQHD浏览器
            iPad: u.indexOf('iPad') > -1, //是否iPad
            webApp: u.indexOf('Safari') == -1 //是否web应该程序，没有头部与底部
          };
        }(),
        language: (navigator.browserLanguage || navigator.language).toLowerCase()
      };

      if (false === browser.versions.iPhone && false === browser.versions.iPad) {
        $scope.$watchMulti([
          //*该行会影响dashboard页面的显示*/function () { return $el.offset().top; },
          function () { return _.startsWith(window.location.hash, '#/discover/') ? $el.offset().top : $(window).height(); },
          function () { return $(window).height(); },
          function () { return $el.find('.kbn-table').height(); }
        ], function (newValue, oldValue) {
          var h = $(window).height() - newValue[0];
          var th = $el.find('.kbn-table').height();
          if (h > th) {
            $el.height(h);
          } else {
            $el.height('auto');
          }
        });
      }

      // cleanup when the scope is destroyed
      $scope.$on('$destroy', function () {
        cleanUp();
        $scroller = $window = null;
      });
    }
  };
});
