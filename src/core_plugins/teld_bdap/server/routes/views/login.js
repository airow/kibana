import { get } from 'lodash';

//export default (server, uiExports, xpackMainPlugin) => {
export default (server, uiExports) => {
  const config = server.config();
  //const cookieName = config.get('xpack.security.cookieName');
  const login = uiExports.apps.byId.autologin;

  server.route({
    method: 'GET',
    path: '/login',
    handler(request, reply) {

      /*
      const xpackInfo = xpackMainPlugin && xpackMainPlugin.info;
      const licenseCheckResults = xpackInfo && xpackInfo.isAvailable() && xpackInfo.feature('security').getLicenseCheckResults();
      const showLogin = get(licenseCheckResults, 'showLogin');

      const isUserAlreadyLoggedIn = !!request.state[cookieName];
      if (isUserAlreadyLoggedIn || !showLogin) {
        const next = get(request, 'query.next', '/');
        return reply.redirect(`${config.get('server.basePath')}${next}`);
      }
      */
      console.log("autologin");
      console.log(login);
      console.log(config.get("elasticsearch.username"));
      console.log(config.get("elasticsearch.password"));
      //return reply.renderAppWithDefaultConfig(login);
      //return reply('Hello, world!33');
      return reply(login);
    },
    config: {
      auth: false
    }
  });
};
