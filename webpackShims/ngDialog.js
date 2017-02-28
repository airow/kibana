/* 这个文件是导入组件的第一步，用于将需要的文件编译到webpack生成的optimize文件夹中 */

/* 组件的依赖 */
require('jquery');
require('angular');

/* 定义ngDialog组件用到的css及js文件 */
require('node_modules/ng-dialog/css/ngDialog.css');
require('node_modules/ng-dialog/css/ngDialog-theme-default.css');
module.exports = require('node_modules/ng-dialog/js/ngDialog.js'); //可以
//require('script!node_modules/ng-dialog/js/ngDialog'); //可以
//module.exports = require('ng-dialog/js/ngDialog.js');

/* 给模块注入依赖的组件 */
require('ui/modules').get('kibana', ['ngDialog']);


/* 2.到使用组件的文件中 import 与本文件名相同 如 【import ngDialog from 'ngDialog';】或 【require("ngDialog");】  ，模式不区分大小写 

    说明：不import会报错，“Error: [$injector:unpr] Unknown provider: ngDialogProvider <- ngDialog”
*/

/* 3.为controller注入组件 
   
   说明： 不注入，调用方法时会提示方法未定义
*/