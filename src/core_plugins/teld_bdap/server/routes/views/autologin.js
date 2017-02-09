import { get } from 'lodash';
import Boom from 'boom';
import Joi from 'joi';
import getIsValidUser from '../../lib/get_is_valid_user';
import getCalculateExpires from '../../lib/get_calculate_expires';

//export default (server, uiExports, xpackMainPlugin) => {
export default (server, uiExports) => {
  const config = server.config();
  const autologin = uiExports.apps.byId.autologin;

  const isValidUser = getIsValidUser(server);
  const calculateExpires = getCalculateExpires(server);

  server.route({
    method: 'GET',
    path: '/autologin',
    handler(request, reply) {
      const username=config.get("elasticsearch.username");
      const password=config.get("elasticsearch.password");

      console.log(autologin);

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

  server.route({
    method: 'GET',
    path: '/autologin222',
    handler(request, reply) {
      const username=config.get("elasticsearch.username")||"elastic";
      const password=config.get("elasticsearch.password")||"changeme";

      return isValidUser(request, username, password).then((response) => {
        // Initialize the session
        request.cookieAuth.set({
          username,
          password,
          expires: calculateExpires()
        });

        //return reply(response);

        //http://localhost:5601/pm/discover/X2c9KHJlZnJlc2hJbnRlcnZhbDooZGlzcGxheTpPZmYscGF1c2U6IWYsdmFsdWU6MCksdGltZTooZnJvbTpub3ctMzBkLG1vZGU6cXVpY2ssdG86bm93KSkmX2E9KGNvbHVtbnM6IShfc291cmNlKSxpbmRleDonc3lzYWN0aW9ubG9nKicsaW50ZXJ2YWw6YXV0byxxdWVyeToocXVlcnlfc3RyaW5nOihhbmFseXplX3dpbGRjYXJkOiF0LHF1ZXJ5OicqJykpLHNvcnQ6IShDcmVhdGVUaW1lLGRlc2MpKQ==
        let path="/pm/discover/X2c9KHJlZnJlc2hJbnRlcnZhbDooZGlzcGxheTpPZmYscGF1c2U6IWYsdmFsdWU6MCksdGltZTooZnJvbTpub3ctMzBkLG1vZGU6cXVpY2ssdG86bm93KSkmX2E9KGNvbHVtbnM6IShfc291cmNlKSxpbmRleDonc3lzYWN0aW9ubG9nKicsaW50ZXJ2YWw6YXV0byxxdWVyeToocXVlcnlfc3RyaW5nOihhbmFseXplX3dpbGRjYXJkOiF0LHF1ZXJ5OicqJykpLHNvcnQ6IShDcmVhdGVUaW1lLGRlc2MpKQ==";

        console.log(path);
        return reply.redirect(path);

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
