import { get } from 'lodash';
import Boom from 'boom';
import Joi from 'joi';
import getIsValidUser from '../../lib/get_is_valid_user';
import getCalculateExpires from '../../lib/get_calculate_expires';

//export default (server, uiExports, xpackMainPlugin) => {
export default (server, uiExports) => {
  const config = server.config();
  const login = uiExports.apps.byId.autologin;

  const isValidUser = getIsValidUser(server);
  const calculateExpires = getCalculateExpires(server);

  server.route({
    method: 'GET',
    path: '/autologin',
    handler(request, reply) {
      const username=config.get("elasticsearch.username");
      const password=config.get("elasticsearch.password");

      return isValidUser(request, username, password).then((response) => {
        // Initialize the session
        request.cookieAuth.set({
          username,
          password,
          expires: calculateExpires()
        });

        return reply(response);
      }, (error) => {
        request.cookieAuth.clear();
        return reply(Boom.unauthorized(error));
      });
    },
    config: {
      auth: false
    }
  });
};
