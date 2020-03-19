import _ from 'lodash';
import moment from 'moment';
import numeral from 'numeral';
import uiModules from 'ui/modules';
const module = uiModules.get('apps/aggs_conf');

import AggTypesMetricsMetricAggTypeProvider from 'ui/agg_types/metrics/metric_agg_type';
import AggTypesBucketsBucketAggTypeProvider from 'ui/agg_types/buckets/_bucket_agg_type';
import AggTypesIndexProvider from 'ui/agg_types/index';


// This is the only thing that gets injected into controllers
module.service('aggsConfSrv', function (Private, Promise, getAppState) {

  const MetricAggType = Private(AggTypesMetricsMetricAggTypeProvider);
  const BucketAggType = Private(AggTypesBucketsBucketAggTypeProvider);
  const AggTypesIndex = Private(AggTypesIndexProvider);

  this.fieldTypes = ["string", "number", "date", "boolean"];

  this.labelMapping = {
    avg: { title: "平均" },
    sum: { title: "合计" },
    min: { title: "最小值" },
    max: { title: "最大值" }
  };

  this.bindAggs = function (mergedEsResp, vis, aggsResult) {
    if (!vis) return aggsResult;
    const aggregations = mergedEsResp.aggregations;

    debugger;
    // if (!!!vis) { return aggsResult; }
    const bySchemaName = vis.aggs.bySchemaName;
    //{metric: Array(2), segment: Array(1)}

    const byTypeName = vis.aggs.byTypeName;
    //{count: Array(1), date_histogram: Array(1), min: Array(1)}

    const byId = vis.aggs.byId;
    //{1: AggConfig, 2: AggConfig, 3: AggConfig}

    const hasDateHistogram = (false === _.isEmpty(byTypeName.date_histogram));

    debugger;
    aggsResult.length = 0;

    let countId = null;

    if (byTypeName.count) {
      countId = byTypeName.count[0].id;
      let countItem = {
        label: byTypeName.count[0].params.customLabel || "总数",
        value: mergedEsResp.hits.total
      };
      // aggsResult.push(countItem);
    }

    const pureMetric = _.filter(bySchemaName.metric, cc => { return cc.id != countId });

    if (hasDateHistogram) {
      const buckets = aggregations[byTypeName.date_histogram[0].id].buckets;

      const asdf = _.map(pureMetric, iii => { return _.map(buckets, `${iii.id}.value`); });


      _.transform(pureMetric, (result, value, index) => {

        //var makeLabel = `${value.params.field.name} ${labelMapping[value.type.name]}`;

        var makeLabel = `${value.params.field.alias || value.params.field.name} ${this.labelMapping[value.type.name].title}`;

        var tmp = {
          id: value.id,
          label: value.params.customLabel || makeLabel,
          value: 0,
          metricAggType: value.type,
          values: _.map(buckets, `${value.id}.value`),
          sum: 0,
          min: 0,
          max: 0,
          avg: 0,
          count: buckets.length,
          name: value.type.name
        };
        _.transform(tmp.values, (rr, val) => {
          let newMin = rr.min < val || (rr.min = val, true);
          let newMax = rr.max > val || (rr.max = val, true);
          rr.sum += val;
          // rr.avg += rr.sum / values.length;
        }, tmp);
        tmp.avg = tmp.sum / tmp.count;
        tmp.value = tmp[tmp.name];

        _.each(['value', 'sum', 'min', 'max', 'avg'], item => {
          tmp[item] = numeral(tmp[item]).format('0,0.[00]');
        });
        result.push(tmp);

      }, aggsResult);

      console.log(asdf);
    }


    // aggsResult.pop();
    // return [{}, {}, {}, {}];
    return aggsResult;
  }

  this.syncAggMetric = function (vis) {
    // debugger;
    let metric = vis.aggs.bySchemaName.metric;
    let countMetric = _.remove(metric, aggConfig => { return aggConfig.type.name === 'count'; });

    let aggs = [];

    _.transform(metric, function (result, val, index) {
      debugger;
      let params = _.assign(val.write().params, _.omit(val.params, 'field'));
      result.push({ type: val.type.name, schema: "metric", params: params });
    }, aggs);

    console.log(metric);
    return aggs;
  }

  this.AggType = { MetricAggType, BucketAggType };

  this.MetricAggType = AggTypesIndex.byType.metrics;
  this.AggTypesIndex = AggTypesIndex;
});
