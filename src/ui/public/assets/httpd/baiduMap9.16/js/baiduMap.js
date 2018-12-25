/**
 * Created by wuqn on 2017/9/16.
 */

// 百度地图API功能
var map = new BMap.Map('mapShow');    // 创建Map实例
map.centerAndZoom(new BMap.Point(116.404, 39.915), 15);  // 初始化地图,设置中心点坐标和地图级别
$(function () {
  map.addControl(new BMap.MapTypeControl());   //添加地图类型控件
  map.setCurrentCity('北京');          // 设置地图显示的城市 此项是必须设置的
  map.enableScrollWheelZoom(true);     //开启鼠标滚轮缩放

  var qsJson = $.querystring(window.location.href); // 'name=John&age=42'

  var gis = rison.decode(qsJson.gis || '(maintain:!((name:青岛特来电新能源有限公司,x:120.511077,y:36.178033),(name:兰州特来电新能源有限公司,x:103.914602,y:36.055387)),station:(name:甘肃省人民政府大院充电站,x:103.832854,y:36.065676))');
  // gis = {
  //   station: { name: '甘肃省人民政府大院充电站', x: 103.832854, y: 36.065676 },
  //   maintain: [
  //     { name: '青岛特来电新能源有限公司', x: 103.914602, y: 36.055387 },
  //     { name: '兰州特来电新能源有限公司', x: 103.914602, y: 36.055387 }
  //   ]
  // };

  function c(state, value) {
    var coord = value.coord.split(',');
    return { state: state, name: value.name, x: coord[1], y: coord[0], distance: parseFloat(value.distance) };
  }

  console.log(rison.encode(gis));

  /*
  //  构造三个一组的数据坐标.第一个点为电站坐标，第二个第三个为运维公司坐标
  var PointArr = [{ x: 106.7739370000, y: 26.6371410000, name: '电站A', state: '1' },
  { 'x': 106.6622350000, 'y': 26.6271700000, name: '运维公司A', state: '2' },
  { 'x': 106.7786660000, 'y': 26.6572330000, name: '运维公司B', state: '2' }];
  */

  var PointArr = [c(1, gis.station)];

  gis.maintain.forEach(function (eachitem) {
    PointArr.push(c(2, eachitem));
  });

  map.centerAndZoom(new BMap.Point(PointArr[0].x, PointArr[0].y), 14);  // 初始化地图,设置中心点坐标和地图级别
  //在地图上标记这三个点,不同状态添加不同图标
  for (var i = 0; i < PointArr.length; i++) {
    addMarker(new BMap.Point(PointArr[i].x, PointArr[i].y), PointArr[i].name, PointArr[i].state, PointArr);
  }
  //第一个第二个点画线
  var polyline = new BMap.Polyline([
    new BMap.Point(PointArr[0].x, PointArr[0].y),
    new BMap.Point(PointArr[1].x, PointArr[1].y)
  ], { strokeColor: 'blue', strokeWeight: 2, strokeOpacity: 0.5 });   //创建折线
  map.addOverlay(polyline);   //增加折线
  //第一个第三个点画线
  var polyline2 = new BMap.Polyline([
    new BMap.Point(PointArr[0].x, PointArr[0].y),
    new BMap.Point(PointArr[2].x, PointArr[2].y)
  ], { strokeColor: 'red', strokeWeight: 2, strokeOpacity: 0.5 });   //创建折线
  map.addOverlay(polyline2);   //增加折线
});

/**
 * 标记
 * @param {Object} point
 */
function addMarker(point, name, state, pointArr) {

  if (state == '1') {
    var myIcon = new BMap.Icon('css/img/icon_teld_charger.svg', new BMap.Size(45, 45), {
      anchor: new BMap.Size(20, 45)//这句表示图片相对于所加的点的位置mapStart
      // offset: new BMap.Size(-10, 45), // 指定定位位置
      // imageOffset: new BMap.Size(0, 0 - 10 * 25) // 设置图片偏移
    });
    var marker = new BMap.Marker(point, { icon: myIcon });  // 创建标注
    //                var marker = new BMap.Marker(new_point);  // 创建标注
    map.addOverlay(marker);               // 将标注添加到地图中
    // marker2.setAnimation(BMAP_ANIMATION_BOUNCE); //跳动的动画

    var html = [name,
      "",
      "距运维公司：" + pointArr[1].name + pointArr[1].distance + "千米",
      "距最近运维公司：" + pointArr[2].name + pointArr[2].distance + "千米",
    ];

    setInfoBox(html.join("<br>"), marker, new BMap.Size(-10, -70));
  } else if (state == '2') {
    var myIcon = new BMap.Icon('css/img/icon_teld_maintain.png', new BMap.Size(45, 45), {
      anchor: new BMap.Size(20, 45),//这句表示图片相对于所加的点的位置mapStart
       //offset: new BMap.Size(0, 0), // 指定定位位置
       imageOffset: new BMap.Size(0, 10) // 设置图片偏移
    });
    var marker = new BMap.Marker(point, { icon: myIcon });  // 创建标注
    //                var marker = new BMap.Marker(new_point);  // 创建标注
    map.addOverlay(marker);               // 将标注添加到地图中
    // marker2.setAnimation(BMAP_ANIMATION_BOUNCE); //跳动的动画
    setInfoBox(name, marker, new BMap.Size(-10, -15));
  }


}
//加信息提示的文字方法
function setInfoBox(name, marker, offset) {
  // var marker = new BMap.Marker(point);
  var label = new BMap.Label(name, {
    offset: offset || new BMap.Size(-10, -20)
  });
  marker.setLabel(label);

}
