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
            { display: "=", keyword: "term", link: "value" },
            { display: ">", keyword: "range", link: "gt" },
            { display: ">=", keyword: "range", link: "gte" },
            { display: "<", keyword: "range", link: "lt" },
            { display: "<=", keyword: "range", link: "lte" },
          ]
      },
      { name: 'string',     operators: [
            { display: "=", keyword: "match", link: "query", ext:{"type": "phrase"} },
            { display: "包含", keyword: "match", link: "query" },
            { display: ">", keyword: "range", link: "gt" },
            { display: ">=", keyword: "range", link: "gte" },
            { display: "<", keyword: "range", link: "lt" },
            { display: "<=", keyword: "range", link: "lte" },
          ]
      },
      { name: 'number',     operators: [
            //{ display: "=", keyword: "term", link: "value" },
            { display: "=", keyword: "match", link: "query", ext:{"type": "phrase"} },
            { display: ">", keyword: "range", link: "gt" },
            { display: ">=", keyword: "range", link: "gte" },
            { display: "<", keyword: "range", link: "lt" },
            { display: "<", keyword: "range", link: "lte" },
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
            { display: "=", keyword: "term", link: "value" }            
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
