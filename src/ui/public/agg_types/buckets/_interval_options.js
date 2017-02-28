import moment from 'moment';

export default function IntervalOptionsService(Private) {

  // shorthand
  let ms = function (type) { return moment.duration(1, type).asMilliseconds(); };

  return [
    {
      display: 'Auto',
      display_zh_CN: '自动',
      val: 'auto',
      enabled: function (agg) {
        // not only do we need a time field, but the selected field needs
        // to be the time field. (see #3028)
        return agg.fieldIsTimeField();
      }
    },
    {
      display: 'Millisecond',
      display_zh_CN: '毫秒',
      val: 'ms'
    },
    {
      display: 'Second',
      display_zh_CN: '秒',
      val: 's'
    },
    {
      display: 'Minute',
      display_zh_CN: '分钟',
      val: 'm'
    },
    {
      display: 'Hourly',
      display_zh_CN: '每小时',
      val: 'h'
    },
    {
      display: 'Daily',
      display_zh_CN: '每天',
      val: 'd'
    },
    {
      display: 'Weekly',
      display_zh_CN: '每周',
      val: 'w'
    },
    {
      display: 'Monthly',
      display_zh_CN: '每月',
      val: 'M'
    },
    {
      display: 'Yearly',
      display_zh_CN: '每年',
      val: 'y'
    },
    {
      display: 'Custom',
      display_zh_CN: '自定义',
      val: 'custom'
    }
  ];
};
