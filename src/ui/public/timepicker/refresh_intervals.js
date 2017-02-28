import uiModules from 'ui/modules';
let module = uiModules.get('kibana');

module.constant('refreshIntervals', [
  { value : 0, display: 'Off', display_zh_CN: '暂停', section: 0},

  { value : 5000, display: '5 seconds', display_zh_CN: '5秒', section: 1},
  { value : 10000, display: '10 seconds', display_zh_CN: '10秒', section: 1},
  { value : 30000, display: '30 seconds', display_zh_CN: '30秒', section: 1},
  { value : 45000, display: '45 seconds', display_zh_CN: '45秒', section: 1},

  { value : 60000, display: '1 minute', display_zh_CN: '1分钟', section: 2},
  { value : 300000, display: '5 minutes', display_zh_CN: '5分钟', section: 2},
  { value : 900000, display: '15 minutes', display_zh_CN: '15分钟', section: 2},
  { value : 1800000, display: '30 minutes', display_zh_CN: '30分钟', section: 2},

  { value : 3600000, display: '1 hour', display_zh_CN: '1小时', section: 3},
  { value : 7200000, display: '2 hour', display_zh_CN: '2小时', section: 3},
  { value : 43200000, display: '12 hour', display_zh_CN: '12小时', section: 3},
  { value : 86400000, display: '1 day', display_zh_CN: '1天', section: 3}
]);

