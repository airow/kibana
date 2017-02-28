import createAgent from './create_agent';
import mapUriExport from './map_uri_export';
import { resolve } from 'url';
import { assign } from 'lodash';

function createProxyExport(server, method, route, config) {
  //服务端转发es请求的代理-暂时理解为
  const options = {
    method: method,
    path: createProxyExport.createPathExport(route),
    config: {
      timeout: {
        socket: server.config().get('elasticsearch.requestTimeout')
      }
    },
    handler: {
      proxy: {
        mapUri: mapUriExport(server),
        agent: createAgent(server),
        xforward: true,
        timeout: server.config().get('elasticsearch.requestTimeout'),
        onResponse: function (err, responseFromUpstream, request, reply) {

          if (err) {
            reply(err);
            return;
          }
          if (responseFromUpstream.headers.location) {
            // TODO: Workaround for #8705 until hapi has been updated to >= 15.0.0
            responseFromUpstream.headers.location = encodeURI(responseFromUpstream.headers.location);
          }

            reply(null,"<h1>hello</h1>").header("Content-Disposition","attachment;filename=FileName.txt");
          // reply("asdfasdfasdf")
          //   .type('text/plain')
          //   response.header("Content-Disposition","attachment; filename=1.txt");


          //reply(null, responseFromUpstream);

          // const Wreck = require('wreck');
          // Wreck.read(responseFromUpstream, {json:true}, (err, body) => {
          //   /* do stuff */

          //   console.log(JSON.stringify(body));
          //   const response = reply(null, JSON.stringify(body));
          //   response.type('text/plain');
          //   response.header('X-Custom', 'some-value');
          //   response.header("Content-Disposition","attachment; filename=1.txt");
          // });
        }
      }
    },
  };

  assign(options.config, config);

  server.route(options);
};

createProxyExport.createPathExport = function createPathExport(path) {
  const pre = '/elasticsearch';
  const sep = path[0] === '/' ? '' : '/';
  return `${pre}${sep}${path}`;
};

module.exports = createProxyExport;
