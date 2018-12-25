import _ from 'lodash';
import uiModules from 'ui/modules';
//字段别名映射
uiModules
  .get('kibana')
  .filter('fieldAlias', function (Private) {
    return Private(fieldAliasFilterProvider);
  });

function fieldAliasFilterProvider() {
  return alias;

  function alias(str, fields) {
    let returnValue = str;
    if (fields) {
      let field = fields.find(field => field.name === str);
      if(field){
        returnValue = field.alias || field.name;
      }
    }
    return returnValue;
  }
}

export default fieldAliasFilterProvider;
