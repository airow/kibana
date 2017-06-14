import IndexedArray from 'ui/indexed_array';
export default function IndexPatternFieldType() {

  return new IndexedArray({
    index: ['name'],
    group: ['operators'],
    immutable: true,
    initialSet: [
      {
        name: 'ip',         operators: [
            { operatorKey:'ip_equal', display: "=", keyword: "term", link: "value" },
            { operatorKey:'ip_contain', display: "包含", keyword: "term", link: "value" }
          ]
      },
      { name: 'date',       operators: [
            // { display: "=", keyword: "term", link: "value" },
            { operatorKey:'date_equal', display: "=", keyword: "range", link: "gte", strategy: 'date_equal', ext: { "format": "epoch_millis" } },
            { operatorKey:'date_gt', display: ">", keyword: "range", link: "gt", strategy: 'date', ext: {  "format": "epoch_millis" }},
            { operatorKey:'date_gte', display: ">=", keyword: "range", link: "gte", strategy: 'date', ext: { "format": "epoch_millis" } },
            { operatorKey:'date_lt', display: "<", keyword: "range", link: "lt", strategy: 'date', ext: { "format": "epoch_millis" } },
            { operatorKey:'date_lte', display: "<=", keyword: "range", link: "lte", strategy: 'date', ext: {  "format": "epoch_millis" } },
          ]
      },
      { name: 'string',     operators: [
            /** 配置有效
            { display: "精确", keyword: "match", link: "query", ext:{"type": "phrase"} },
            { display: "模糊", keyword: "match", link: "query", strategy: '.keyword', ext: { "type": "phrase" } },
            { display: "分词", keyword: "match", link: "query", strategy: '.keyword' },
            */
            { operatorKey:'string_equal', display: "等于", keyword: "match", link: "query", ext:{"type": "phrase"} },
            { operatorKey:'string_contain', display: "包含", keyword: "match", link: "query", strategy: '.keyword', ext: { "type": "phrase" } },
            //{ operatorKey:'string_contain', display: "包含", keyword: "wildcard", link: "value" },
            { operatorKey:'string_wildcard', display: "通配符", keyword: "wildcard", link: "value" },
          ]
      },
      { name: 'number',     operators: [
            // { display: "=", keyword: "match", link: "query", ext:{"type": "phrase"} },
            { operatorKey:'number_equal', display: "=", keyword: "term", link: "value" },
            { operatorKey:'number_gt', display: ">", keyword: "range", link: "gt" },
            { operatorKey:'number_gte', display: ">=", keyword: "range", link: "gte" },
            { operatorKey:'number_lt', display: "<", keyword: "range", link: "lt" },
            { operatorKey:'number_lte', display: "<=", keyword: "range", link: "lte" },
          ]
      },
      { name: 'boolean',    operators: [
            { operatorKey:'boolean_equal', display: "=", keyword: "term", link: "value" }
          ]
      },
      { name: 'conflict',   operators: [
            { operatorKey:'conflict_equal', display: "=", keyword: "term", link: "value" }
          ]
      },
      { name: 'geo_point',  operators: [
            { operatorKey:'geo_bounding_box', display: "geo_bounding_box", keyword: "geo_bounding_box", link: "value" },
            { operatorKey:'geo_distance', display: "geo_distance", keyword: "geo_distance", link: "value" }
          ]
      },
      { name: 'geo_shape',  operators: [
            { operatorKey:'geo_shape', display: "=", keyword: "term", link: "value" }
          ]
      },
      { name: 'attachment', operators: [
            { operatorKey:'attachment_equal', display: "=", keyword: "term", link: "value" }
          ]
      },
      { name: 'murmur3',    operators: [
            { operatorKey:'murmur3_equal', display: "=", keyword: "term", link: "value" }
          ]
      },
      { name: 'unknown',    operators: [
            { operatorKey:'unknown_equal', display: "=", keyword: "term", link: "value" }
          ]
     },
      { name: '_source',    operators: [
            { operatorKey:'_source_equal', display: "=", keyword: "term", link: "value" }
          ]
     },
    ]
  });
};
