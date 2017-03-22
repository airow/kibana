/* 这个文件是导入组件的第一步，用于将需要的文件编译到webpack生成的optimize文件夹中 */

/* 组件的依赖 */
require('jquery');
require('angular');

/* 定义treeGrid组件用到的css及js文件 */
require('node_modules/angular-bootstrap-grid-tree/src/treeGrid.css');
module.exports = require('node_modules/angular-bootstrap-grid-tree/src/tree-grid-directive.js'); //可以
//require('script!node_modules/angular-bootstrap-grid-tree/js/treeGrid'); //可以
//module.exports = require('angular-bootstrap-grid-tree/js/treeGrid.js');

/* 给模块注入依赖的组件 */
require('ui/modules').get('kibana', ['treeGrid']);