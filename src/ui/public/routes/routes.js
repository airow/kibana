import RouteManager from './route_manager';
import 'angular-route/angular-route';
import uiModules from 'ui/modules';
import 'ui/ADM-dateTimePicker/ADM-dateTimePicker.js';
let defaultRouteManager = new RouteManager();

module.exports = {
  ...defaultRouteManager,
  enable() {
    uiModules
      .get('kibana', ['ngRoute', 'ADM-dateTimePicker'])
      .config(defaultRouteManager.config)
      .config(['ADMdtpProvider', function (ADMdtp) {
        // ADMdtp.setOptions({
        //   calType: 'gregorian',
        //   format: 'YYYY-MM-DD hh:mm',
        //   multiple: false,
        //   gregorianDic: {
        //     title: 'Gregorian',
        //     monthsNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        //     daysNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        //     todayBtn: '今天',
        //   }
        // });
      }]);
  }
};
