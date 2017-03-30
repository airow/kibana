import _ from 'lodash';
import 'ui/notify';
import uiModules from 'ui/modules';

import DiscoverUiConfProvider from 'plugins/kibana/ui_conf_provider/discover_uiconf';


const module = uiModules.get('discover/saved_searches', [
  'kibana/notify',
  'kibana/courier'
]);

module.factory('SavedSearch', function (courier,config,Private) {
  _.class(SavedSearch).inherits(courier.SavedObject);
  function SavedSearch(id) {
    courier.SavedObject.call(this, {
      type: SavedSearch.type,
      mapping: SavedSearch.mapping,
      searchSource: SavedSearch.searchSource,

      id: id,
      defaults: {
        title: 'New Saved Search',
        description: '',
        columns: [],
        hits: 0,
        sort: [],
        version: 1,
        tagetIndex: '',
        // pageSize: config.get('discover:sampleSize'),
        // menus: [],
        uiConf: Private(DiscoverUiConfProvider).defaultConf
      }
    });
  }

  /**是否在编辑界面显示扩展内容 */
  SavedSearch.hasUiConf = true;

  SavedSearch.type = 'search';

  SavedSearch.mapping = {
    title: 'string',
    description: 'string',
    hits: 'integer',
    columns: 'string',
    sort: 'string',
    version: 'integer',
    tagetIndex: 'string',
    // pageSize: 'integer',
    // menus: 'string'
  };

  SavedSearch.searchSource = true;

  return SavedSearch;
});
