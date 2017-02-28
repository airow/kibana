require('jquery');
require('node_modules/angular/angular');
require('node_modules/angular-i18n/angular-locale_zh-cn');
module.exports = window.angular;

require('node_modules/angular-elastic/elastic');

require('ui/modules').get('kibana', ['monospaced.elastic']);
