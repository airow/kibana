require('jquery');
require('node_modules/angular/angular');
require('node_modules/angular-i18n/angular-locale_zh-cn');
require('./angular-translate');
var translations = require('./angular-translate-locale-en');
var cntranslations = require('./angular-translate-locale-cn');
module.exports = window.angular;

require('node_modules/angular-elastic/elastic');

var kibanaApp = require('ui/modules').get('kibana', ['monospaced.elastic', 'pascalprecht.translate']);
kibanaApp.config(['$translateProvider', function ($translateProvider) {
    // add translation table
    $translateProvider
        .translations('en', translations)
        .translations('cn', cntranslations)
    $translateProvider.preferredLanguage('cn');
}]);