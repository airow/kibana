import _ from 'lodash';
import moment from 'moment';
import uiModules from 'ui/modules';
const module = uiModules.get('apps/aggs_conf');

import AggTypesMetricsMetricAggTypeProvider from 'ui/agg_types/metrics/metric_agg_type';
import AggTypesBucketsBucketAggTypeProvider from 'ui/agg_types/buckets/_bucket_agg_type';


// This is the only thing that gets injected into controllers
module.service('aggsConfSrv', function (Private, Promise, getAppState) {

  const MetricAggType = Private(AggTypesMetricsMetricAggTypeProvider);
  const BucketAggType = Private(AggTypesBucketsBucketAggTypeProvider);

  this.fieldTypes = ["string", "number", "date", "boolean"];

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

    const labelMapping = {
      sum: "合计",
      min: "最小值",
      max: "最大值",
      avg: "均值"
    };

    if (hasDateHistogram) {
      const buckets = aggregations[byTypeName.date_histogram[0].id].buckets;

      const asdf = _.map(pureMetric, iii => { return _.map(buckets, `${iii.id}.value`); });


      _.transform(pureMetric, (result, value, index) => {

        var makeLabel = `${value.params.field.name} ${labelMapping[value.type.name]}`;

        var tmp = {
          id: value.id,
          label: value.type.params.customLabel || makeLabel,
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
        // result[value.id] = tmp;
        result.push(tmp);
        // aggsResult.pureMetric

      }, aggsResult);

      console.log(asdf);
    }


    // aggsResult.pop();
    // return [{}, {}, {}, {}];
    return aggsResult;
  }

  this.AggType = { MetricAggType, BucketAggType };
});
