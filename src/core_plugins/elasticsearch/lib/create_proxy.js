import createAgent from './create_agent';
import mapUri from './map_uri';
import { resolve } from 'url';
import { assign } from 'lodash';

function createProxy(server, method, route, config) {
  //服务端转发es请求的代理-暂时理解为
  const options = {
    method: method,
    path: createProxy.createPath(route),
    config: {
      timeout: {
        socket: server.config().get('elasticsearch.requestTimeout')
      }
    },
    handler: {
      proxy: {
        mapUri: mapUri(server),
        agent: createAgent(server),
        xforward: true,
        timeout: server.config().get('elasticsearch.requestTimeout'),
        onResponse: function (err, responseFromUpstream, request, reply) {
          //console.log('receiving the response from the upstream.');
          if (err) {
            reply(err);
            return;
          }
          if (responseFromUpstream.headers.location) {
            // TODO: Workaround for #8705 until hapi has been updated to >= 15.0.0
            responseFromUpstream.headers.location = encodeURI(responseFromUpstream.headers.location);
          }

          reply(null, responseFromUpstream);

          // const Wreck = require('wreck');
          // Wreck.read(responseFromUpstream, {json:true}, (err, body) => {
          //   /* do stuff */
          //
          //   console.log(JSON.stringify(body));
          // });
        }
      }
    },
  };

  assign(options.config, config);

  server.route(options);
};

createProxy.createPath = function createPath(path) {
  const pre = '/elasticsearch';
  const sep = path[0] === '/' ? '' : '/';
  return `${pre}${sep}${path}`;
};

createProxy.msearch = function msearch(server, method, route, config) {
  //服务端转发es请求的代理-暂时理解为
  const options = {
    method: method,
    path: createProxy.createPath(route),
    config: {
      timeout: {
        socket: server.config().get('elasticsearch.requestTimeout')
      }
    },
    handler: {
      proxy: {
        mapUri: mapUri(server),
        agent: createAgent(server),
        xforward: true,
        timeout: server.config().get('elasticsearch.requestTimeout'),
        onResponse: function (err, responseFromUpstream, request, reply) {
          //console.log('receiving the response from the upstream.');
          if (err) {
            reply(err);
            return;
          }
          if (responseFromUpstream.headers.location) {
            // TODO: Workaround for #8705 until hapi has been updated to >= 15.0.0
            responseFromUpstream.headers.location = encodeURI(responseFromUpstream.headers.location);
          }

          reply(null, responseFromUpstream);

          // const Wreck = require('wreck');
          // Wreck.read(responseFromUpstream, {json:true}, (err, body) => {
          //   /* do stuff */
          //
          //   console.log(JSON.stringify(body));
          // });
        }
      }
    },
  };

  assign(options.config, config);

  server.route(options);
};

module.exports = createProxy;
