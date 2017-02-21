import _ from 'lodash';
import 'ui/notify';
import uiModules from 'ui/modules';


const module = uiModules.get('discover/saved_searches', [
  'kibana/notify',
  'kibana/courier'
]);

module.factory('SavedSearch', function (courier,config) {
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
        tagetIndex:'',
        pageSize: config.get('discover:sampleSize'),
        menus: []
      }
    });
  }

  SavedSearch.type = 'search';

  SavedSearch.mapping = {
    title: 'string',
    description: 'string',
    hits: 'integer',
    columns: 'string',
    sort: 'string',
    version: 'integer',
    tagetIndex: 'string',
    pageSize: 'integer',
    menus: 'string',
  };

  SavedSearch.searchSource = true;

  return SavedSearch;
});
