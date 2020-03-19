import _ from 'lodash';

export default function UiConfProvider(Private, Promise, config) {

  // 这种负责接口的映射需要在 \src\ui\public\courier\saved_object\saved_object.js文件中的self.init = _.once(function () {方法中定义
  this.defaultConf = {
    /** 控制discover也中时序图是否显示，true：表示显示 */
    showTimeDiagram: true,

    /** 界面中按钮的 name,
     * []: 显示全部按钮
     * [""]: 不显示任何按钮
     * ["open","help","export","save"]
    */
    menus: [],

    advancedSearchBool: {},

    pageSize: config.get('discover:sampleSize'),/** */
    sizeRange: [],/** */
    authObj: [{ disable: true, '绑定字段': ['授权对象名称'] }],/** 授权对象 */

    /** */
    navigation: [],
    fixedHeader: false,
    columnConf: [
      {
        "rowStyle": false,
        fieldName: '绑定字段',
        disable: true,
        'coloring': {
          'bgColor': false,
          'strategy': 'ranges|thresholds|expression|enumeration|custom',
          'template': '<span>${value}</span>',
          'ranges': [
            { 'range': '[0 TO 10)', 'color': 'red' },
            { 'range': '[10 TO 15]', 'color': 'green' },
            { 'range': '(15 TO *]', 'color': 'yellow' }
          ],
          'thresholds': [
            { 'value': 0, 'color': 'red' },
            { 'value': 50, 'color': 'red' }
          ],
          'enumeration': [
            { 'value': '1', 'text': '公交站', 'color': 'red' },
            { 'value': '2', 'text': '非公交' }
          ],
          'expression': {
            'body': 'return value; //方法签名 fun(value, row, fieldName)'
          },
          "custom": {
            "fun": "return {value:`<a href='http://www.baidu.com'>${value}</a>`}",
            "fun_demo1": "return {style:{'background-color': 'red'}}; //自定义央视",
            "fun_demo2": "return {style:{'color': 'white','background-color': 'black'}}; //配合 rowStyle:true可以设置正行背景色",
            "fun_demo3": "return value=='222' ? {value:value, style:{'color': 'red'}} : {value:value+'ccc'};",
            "fun_demo4": "return {value:`<a href='http://www.baidu.com'>${value}</a>`}; //添加链接"
          }
        },
        'style': 'width:100px'
      }
    ],

    aggs: []
  };

};
