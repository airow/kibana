import HapiTemplates from 'vision';//视图引擎
import HapiStaticFiles from 'inert';//静态资源访问
import HapiProxy from 'h2o2';//代理转发
import { fromNode } from 'bluebird';

const plugins = [HapiTemplates, HapiStaticFiles, HapiProxy];

async function registerPlugins(server) {
  await fromNode(cb => {
    server.register(plugins, cb);
  });
}

export default function (kbnServer, server, config) {
  registerPlugins(server);
}
