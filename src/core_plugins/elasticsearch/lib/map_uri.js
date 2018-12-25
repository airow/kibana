import { defaults, omit, trimLeft, trimRight } from 'lodash';
import { parse as parseUrl, format as formatUrl, resolve } from 'url';
import filterHeaders from './filter_headers';
import setHeaders from './set_headers';

export default function mapUri(server, prefix) {
  const config = server.config();

  function joinPaths(pathA, pathB) {
    return trimRight(pathA, '/') + '/' + trimLeft(pathB, '/');
  }

  return function (request, done) {
    //重写_msearch查询条件
    // console.log('+++++++++++++++++++++++++++++++++');
    // if (request.method === 'post') {
    //   console.log('' + request.payload);
    //   //       request.payload = new Buffer(
    //   // `{"index":["baidutj"],"ignore_unavailable":true,"preference":1526716049196}
    //   // {"query":{"bool":{"must":[{"query_string":{"query":"action:\"行为分析\"","analyze_wildcard":true,"allow_leading_wildcard":false}},{"bool":{}},{"range":{"date":{"gte":1495180293452,"lte":1526716293452,"format":"epoch_millis"}}}],"must_not":[]}},"highlight":{"pre_tags":["@kibana-highlighted-field@"],"post_tags":["@/kibana-highlighted-field@"],"fields":{"*":{}},"require_field_match":false,"fragment_size":2147483647},"size":100,"sort":[{"_score":{"order":"desc"}}],"_source":{"excludes":[]},"aggs":{"2":{"date_histogram":{"field":"date","interval":"1w","time_zone":"Asia/Shanghai","min_doc_count":1}}},"stored_fields":["*"],"script_fields":{},"docvalue_fields":["date","sync_date"]}
    //   // `);
    //   console.log(request.payload.toString());
    // }
    //console.log('doing some aditional stuff before redirecting');
    const {
      protocol: esUrlProtocol,
      slashes: esUrlHasSlashes,
      auth: esUrlAuth,
      hostname: esUrlHostname,
      port: esUrlPort,
      pathname: esUrlBasePath,
      query: esUrlQuery
    } = parseUrl(config.get('elasticsearch.url'), true);

    // copy most url components directly from the elasticsearch.url
    const mappedUrlComponents = {
      protocol: esUrlProtocol,
      slashes: esUrlHasSlashes,
      auth: esUrlAuth,
      hostname: esUrlHostname,
      port: esUrlPort
    };

    // pathname
    const reqSubPath = request.path.replace('/elasticsearch', '');
    mappedUrlComponents.pathname = joinPaths(esUrlBasePath, reqSubPath);

    // querystring
    const mappedQuery = defaults(omit(request.query, '_'), esUrlQuery || {});
    if (Object.keys(mappedQuery).length) {
      mappedUrlComponents.query = mappedQuery;
    }

    const filteredHeaders = filterHeaders(request.headers, config.get('elasticsearch.requestHeadersWhitelist'));
    const mappedHeaders = setHeaders(filteredHeaders, config.get('elasticsearch.customHeaders'));
    const mappedUrl = formatUrl(mappedUrlComponents);
    //console.log(mappedUrl);
    //console.log(mappedHeaders);
    if (reqSubPath === '/_msearch') {
      done(null, mappedUrl, mappedHeaders);
    } else {
      done(null, mappedUrl, mappedHeaders);
    }
  };
};
