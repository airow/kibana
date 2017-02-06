import { get } from 'lodash';
import Boom from 'boom';
import Joi from 'joi';

export default (server, uiExports) => {

  server.route({
    method: 'GET',
    path: '/pm/{a}/{p}',
    handler(request, reply) {
      let base64 = new Buffer('AAwww.baidu.com/img/sslm1_logo.gifZZ').toString('base64');

      base64=new Buffer("AA_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(from:now-30d,mode:quick,to:now))&_a=(columns:!(_source),index:'sysactionlog*',interval:auto,query:(query_string:(analyze_wildcard:!t,query:'*')),sort:!(CreateTime,desc))_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(from:now-30d,mode:quick,to:now))&_a=(columns:!(_source),index:'sysactionlog*',interval:auto,query:(query_string:(analyze_wildcard:!t,query:'*')),sort:!(CreateTime,desc))_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(from:now-30d,mode:quick,to:now))&_a=(columns:!(_source),index:'sysactionlog*',interval:auto,query:(query_string:(analyze_wildcard:!t,query:'*')),sort:!(CreateTime,desc))ZZ").toString("base64");

      let url="_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(from:now-30d,mode:quick,to:now))&_a=(columns:!(_source),index:'sysactionlog*',interval:auto,query:(query_string:(analyze_wildcard:!t,query:'*')),sort:!(CreateTime,desc))_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(from:now-30d,mode:quick,to:now))&_a=(columns:!(_source),index:'sysactionlog*',interval:auto,query:(query_string:(analyze_wildcard:!t,query:'*')),sort:!(CreateTime,desc))_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(from:now-30d,mode:quick,to:now))&_a=(columns:!(_source),index:'sysactionlog*',interval:auto,query:(query_string:(analyze_wildcard:!t,query:'*')),sort:!(CreateTime,desc))";
      console.log(new Buffer("AA"+url+"ZZ").toString("base64"));
      console.log(new Buffer(url).toString("base64"));

      let a=request.params.a;
      let p=request.params.p;
console.log(p);
      let pp=new Buffer(p,"base64").toString();

      console.log(pp);

      let path=["/app/kibana#/",a,"?",pp];

      console.log(path.join(""));

      //return reply.redirect('http://www.qq.com');
      //return reply.redirect("/app/kibana#/discover?_g=()&_a=(columns:!(_source),index:'sysactionlog*',interval:auto,query:(query_string:(analyze_wildcard:!t,query:'*')),sort:!(CreateTime,desc))");
      return reply.redirect(path.join(""));
    },
    config: {
      auth: false
    }
  });
};
