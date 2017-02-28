import uiModules from 'ui/modules';
let module = uiModules.get('kibana');

module.constant('quickRanges', [
  { from: 'now/d',    to: 'now/d',    display: 'Today',                 display_zh_CN: '今天',          section: 0 },
  { from: 'now/w',    to: 'now/w',    display: 'This week',             display_zh_CN: '本周',          section: 0 },
  { from: 'now/M',    to: 'now/M',    display: 'This month',            display_zh_CN: '本月',          section: 0 },
  { from: 'now/y',    to: 'now/y',    display: 'This year',             display_zh_CN: '今年',          section: 0 },
  { from: 'now/d',    to: 'now',      display: 'The day so far',        display_zh_CN: '今天到现在',     section: 0 },
  { from: 'now/w',    to: 'now',      display: 'Week to date',          display_zh_CN: '本周到现在',  section: 0 },
  { from: 'now/M',    to: 'now',      display: 'Month to date',         display_zh_CN: '月初到现在', section: 0 },
  { from: 'now/y',    to: 'now',      display: 'Year to date',          display_zh_CN: '年初到现在',  section: 0 },

  { from: 'now-1d/d', to: 'now-1d/d', display: 'Yesterday',             display_zh_CN: '昨天',      section: 1 },
  { from: 'now-2d/d', to: 'now-2d/d', display: 'Day before yesterday',  display_zh_CN: '前天',      section: 1 },
  { from: 'now-7d/d', to: 'now-7d/d', display: 'This day last week',    display_zh_CN: '上周今天',  section: 1 },
  { from: 'now-1w/w', to: 'now-1w/w', display: 'Previous week',         display_zh_CN: '上周',      section: 1 },
  { from: 'now-1M/M', to: 'now-1M/M', display: 'Previous month',        display_zh_CN: '上个月',    section: 1 },
  { from: 'now-1y/y', to: 'now-1y/y', display: 'Previous year',         display_zh_CN: '去年',      section: 1 },

  { from: 'now-15m',  to: 'now',      display: 'Last 15 minutes',       display_zh_CN: '最近15分钟',      section: 2 },
  { from: 'now-30m',  to: 'now',      display: 'Last 30 minutes',       display_zh_CN: '最近30分钟',      section: 2 },
  { from: 'now-1h',   to: 'now',      display: 'Last 1 hour',           display_zh_CN: '最近1小时',      section: 2 },
  { from: 'now-4h',   to: 'now',      display: 'Last 4 hours',          display_zh_CN: '最近4小时',      section: 2 },
  { from: 'now-12h',  to: 'now',      display: 'Last 12 hours',         display_zh_CN: '最近12小时',      section: 2 },
  { from: 'now-24h',  to: 'now',      display: 'Last 24 hours',         display_zh_CN: '最近24小时',      section: 2 },
  { from: 'now-7d',   to: 'now',      display: 'Last 7 days',           display_zh_CN: '最近7天',      section: 2 },

  { from: 'now-30d',  to: 'now',      display: 'Last 30 days',          display_zh_CN: '最近30天',      section: 3 },
  { from: 'now-60d',  to: 'now',      display: 'Last 60 days',          display_zh_CN: '最近60天',      section: 3 },
  { from: 'now-90d',  to: 'now',      display: 'Last 90 days',          display_zh_CN: '最近90天',      section: 3 },
  { from: 'now-6M',   to: 'now',      display: 'Last 6 months',         display_zh_CN: '最近半年',      section: 3 },
  { from: 'now-1y',   to: 'now',      display: 'Last 1 year',           display_zh_CN: '最近1年',      section: 3 },
  { from: 'now-2y',   to: 'now',      display: 'Last 2 years',          display_zh_CN: '最近2年',      section: 3 },
  { from: 'now-5y',   to: 'now',      display: 'Last 5 years',          display_zh_CN: '最近5年',      section: 3 },

]);