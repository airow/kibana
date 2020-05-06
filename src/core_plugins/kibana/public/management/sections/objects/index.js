import management from 'ui/management';
import 'plugins/kibana/management/sections/objects/_view';
import 'plugins/kibana/management/sections/objects/_objects';
import 'plugins/kibana/management/sections/objects/_edit';
import 'plugins/kibana/management/sections/objects/_edit_v2';
import 'ace';
import 'ui/directives/confirm_click';
import uiModules from 'ui/modules';

// add the module deps to this module
uiModules.get('apps/management');

management.getSection('kibana').register('objects', {
  display: '查询方案',
  order: 10,
  url: '#/management/kibana/objects'
});
