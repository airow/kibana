import IndexedArray from 'ui/indexed_array';
export default function IndexPatternFieldType() {

  return new IndexedArray({
    index: ['name'],
    group: ['operators'],
    immutable: true,
    initialSet: [
      {
        name: 'ip',         operators: [
            { display: "=", keyword: "term", link: "value" },
            { display: "包含", keyword: "term", link: "value" }
          ]
      },
      { name: 'date',       operators: [
            // { display: "=", keyword: "term", link: "value" },
            { display: ">", keyword: "range", link: "gt", strategy: 'date', ext: {  "format": "YYYY-MM-DD" }},
            { display: ">=", keyword: "range", link: "gte", strategy: 'date', ext: { "format": "YYYY-MM-DD" } },
            { display: "<", keyword: "range", link: "lt", strategy: 'date', ext: { "format": "YYYY-MM-DD" } },
            { display: "<=", keyword: "range", link: "lte", strategy: 'date', ext: {  "format": "YYYY-MM-DD" } },
          ]
      },
      { name: 'string',     operators: [
            /** 配置有效
            { display: "精确", keyword: "match", link: "query", ext:{"type": "phrase"} },
            { display: "模糊", keyword: "match", link: "query", strategy: '.keyword', ext: { "type": "phrase" } },
            { display: "分词", keyword: "match", link: "query", strategy: '.keyword' },
            */
            { display: "等于", keyword: "match", link: "query", ext:{"type": "phrase"} },
            { display: "包含", keyword: "match", link: "query", strategy: '.keyword', ext: { "type": "phrase" } },
          ]
      },
      { name: 'number',     operators: [
            // { display: "=", keyword: "match", link: "query", ext:{"type": "phrase"} },
            { display: "=", keyword: "term", link: "value" },
            { display: ">", keyword: "range", link: "gt" },
            { display: ">=", keyword: "range", link: "gte" },
            { display: "<", keyword: "range", link: "lt" },
            { display: "<=", keyword: "range", link: "lte" },
          ]
      },
      { name: 'boolean',    operators: [
            { display: "=", keyword: "term", link: "value" }
          ]
      },
      { name: 'conflict',   operators: [
            { display: "=", keyword: "term", link: "value" }            
          ]
      },
      { name: 'geo_point',  operators: [
            { display: "geo_bounding_box", keyword: "geo_bounding_box", link: "value" },
            { display: "geo_distance", keyword: "geo_distance", link: "value" }
          ]
      },
      { name: 'geo_shape',  operators: [
            { display: "=", keyword: "term", link: "value" }            
          ]
      },
      { name: 'attachment', operators: [
            { display: "=", keyword: "term", link: "value" }            
          ]
      },
      { name: 'murmur3',    operators: [
            { display: "=", keyword: "term", link: "value" }            
          ]
      },
      { name: 'unknown',    operators: [
            { display: "=", keyword: "term", link: "value" }            
          ]
     },
      { name: '_source',    operators: [
            { display: "=", keyword: "term", link: "value" }            
          ]
     },
    ]
  });
};
