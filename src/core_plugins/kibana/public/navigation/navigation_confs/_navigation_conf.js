import _ from 'lodash';
import 'ui/notify';
import uiModules from 'ui/modules';

const module = uiModules.get('discover/saved_searches', [
  'kibana/notify',
  'kibana/courier'
]);

module.factory('NavigationConf', function (courier,config,Private) {
  _.class(NavigationConf).inherits(courier.SavedObject);
  function NavigationConf(id) {
    courier.SavedObject.call(this, {
      type: NavigationConf.type,
      mapping: NavigationConf.mapping,
      mappingProps: NavigationConf.mappingProps,
      id: id,
      defaults: {
        title: 'New Saved NavigationConf',
        navigation: {}
      }
    });
  }

  NavigationConf.hasUiConf = false;

  NavigationConf.allowEdit = true;

  NavigationConf.type = 'navigationConf';

  NavigationConf.mapping = {
    //navigation: 'string'
  };

  NavigationConf.mappingProps = {
    "navigation": {
      "properties": {
        "disabled": {
          "type": "boolean"
        },
        "display": {
          "type": "keyword"
        },
        "url": {
          "type": "keyword"
        }
      }
    }
  }

  /**这个值会影响在编辑页面中生成 “kibanaSavedObjectMeta.searchSourceJSON”项 */
  //NavigationConf.searchSource = true;

  return NavigationConf;
});
