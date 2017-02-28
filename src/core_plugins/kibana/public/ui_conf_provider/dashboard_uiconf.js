import _ from 'lodash';

export default function DashboardUiConfProvider(Private, Promise, config) {

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


    pageSize: config.get('discover:sampleSize')/** */
  };

};
