import hapiAuthBasic from 'hapi-auth-basic';
import hapiAuthCookie from 'hapi-auth-cookie';
import { resolve } from 'path';
import Promise from 'bluebird';

import getBasicValidate from './server/lib/get_basic_validate';
import getCookieValidate from './server/lib/get_cookie_validate';
import getUserProvider from './server/lib/get_user';

import initAuthenticateApi from './server/routes/api/v1/authenticate';
//import initLoginView from './server/routes/views/login';
import initAutoLoginView from './server/routes/views/autologin';
//import initAutoLoginView from './server/routes/views/login';
import createScheme from './server/lib/login_scheme';

import initPathMappingView from './server/routes/path/mapping';

export default function (kibana) {
  return new kibana.Plugin({
    require: ['kibana', 'elasticsearch'],

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
        cookieName: Joi.string().default('sid'),
        encryptionKey: Joi.string(),
        sessionTimeout: Joi.number().allow(null).default(null),
        secureCookies: Joi.boolean().default(false)
      }).default();
    },

    uiExports: {
      //chromeNavControls: ['plugins/security/views/nav_control'],
      //managementSections: ['plugins/security/views/management'],

      // apps:[
      //   {
      //     id: 'autologin',
      //     title: 'Login',
      //     main: 'plugins/teld_bdap/views/login/login',
      //     //main: 'plugins/teld_bdap/app',
      //     hidden: true,
      //     injectVars(server) {
      //       const pluginId = 'security';
      //       const xpackInfo = server.plugins.xpack_main.info;
      //       const { showLogin, loginMessage, allowLogin } = xpackInfo.feature(pluginId).getLicenseCheckResults() || {};
      //
      //       return {
      //         loginState: {
      //           showLogin,
      //           allowLogin,
      //           loginMessage
      //         }
      //       };
      //     }
      //   }
      // ]

      apps:[
        {
          id: 'autologin',
          // The title of the app (will be shown to the user)
          title: 'autologin',
          // An description of the application.
          description: 'An awesome Kibana plugin',
          // The require reference to the JavaScript file for this app
          main: 'plugins/teld_bdap/views/login/login',
          // The require reference to the icon of the app
          icon: 'plugins/teld_bdap/icon.svg'
        },
        {
          // The title of the app (will be shown to the user)
          title: 'teld_bdap',
          // An description of the application.
          description: 'An awesome Kibana plugin',
          // The require reference to the JavaScript file for this app
          main: 'plugins/teld_bdap/views/login/login',
          // The require reference to the icon of the app
          icon: 'plugins/teld_bdap/icon.svg'
        }
      ],

      /*
      app: {
        id: 'autologin',
        // The title of the app (will be shown to the user)
        title: 'teld_bdap',
        // An description of the application.
        description: 'An awesome Kibana plugin',
        // The require reference to the JavaScript file for this app
        main: 'plugins/teld_bdap/views/login/login',
        // The require reference to the icon of the app
        icon: 'plugins/teld_bdap/icon.svg'
      }*/

    },

    // The init method will be executed when the Kibana server starts and loads
    // this plugin. It is used to set up everything that you need.
    init(server, options) {
      // Just call the api module that we imported above (the server/routes.js file)
      // and pass the server to it, so it can register several API interfaces at the server.
      //api(server);

      const thisPlugin = this;

      const cookieName = "DDDD";
      const config = server.config();
/*
      const register = Promise.promisify(server.register, {context: server});
      Promise.all([
        register(hapiAuthBasic),
        register(hapiAuthCookie)
      ])
        .then(() => {
          server.auth.scheme('login', createScheme({
            redirectUrl: (path) => loginUrl(config.get('server.basePath'), path),
            strategies: ['security-cookie', 'security-basic']
          }));

          //server.auth.strategy('session', 'login', 'required');

          server.auth.strategy('security-basic', 'basic', false, {
            validateFunc: getBasicValidate(server)
          });

          server.auth.strategy('security-cookie', 'cookie', false, {
            cookie: cookieName,
            password: config.get('xpack.security.encryptionKey'),
            clearInvalid: true,
            validateFunc: getCookieValidate(server),
            isSecure: config.get('xpack.security.secureCookies'),
            path: config.get('server.basePath') + '/'
          });
        });
*/
      // load multiple plugins

      /*
      server.register([hapiAuthBasic,hapiAuthCookie], (err) => {
        if (err) {
          console.error('Failed to load a plugin:', err);
        }

        // server.auth.scheme('login', createScheme({
        //   redirectUrl: (path) => loginUrl(config.get('server.basePath'), path),
        //   strategies: ['security-cookie', 'security-basic']
        // }));

        //server.auth.strategy('session', 'login', 'required');

        server.auth.strategy('security-basic', 'basic', false, {
          validateFunc: getBasicValidate(server)
        });

        // server.auth.strategy('security-cookie', 'cookie', false, {
        //   cookie: cookieName,
        //   //password: config.get('xpack.security.encryptionKey'),
        //   password: 'password-should-be-32-characters',
        //   password:"RAS",
        //   clearInvalid: true,
        //   validateFunc: getCookieValidate(server),
        //   //isSecure: config.get('xpack.security.secureCookies'),
        //   path: config.get('server.basePath') + '/'
        // });


        server.auth.strategy('security-cookie', 'cookie', false, {
          password: 'password-should-be-32-characters',
          cookie: 'sid-example',
          redirectTo: '/login',
          isSecure: false,
          validateFunc: getCookieValidate(server)
          // validateFunc: function (request, session, callback) {
          //   cache.get(session.sid, (err, cached) => {
          //     if (err) {
          //       return callback(err, false);
          //     }
          //     if (!cached) {
          //       return callback(null, false);
          //     }
          //     return callback(null, true, cached.account);
          //   });
          // }
        });
      });

      initAuthenticateApi(server);
      //getUserProvider(server);
      */

      //initLoginView(server, thisPlugin);
      initAutoLoginView(server, thisPlugin);

      //注册服务端用于地址转换的路由
      initPathMappingView(server,thisPlugin);
    }

  });
};
function loginUrl(baseUrl, requestedPath) {
  const next = encodeURIComponent(requestedPath);
  return `${baseUrl}/login?next=${next}`;
}
