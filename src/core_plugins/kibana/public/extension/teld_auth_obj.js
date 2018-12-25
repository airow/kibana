import _ from 'lodash';

export default function getAuthObjValue($http, authObjConf) {
  var authObjValue = [];
  if (window.document.cookie.indexOf('telda') === -1) {
    return Promise.resolve([]);
  }
  return $http({
    method: 'POST',
    url: '/getdatap',
    data: authObjConf
  }).then(response => {
    if (response.status === 200) {
      _.each(response.data, (valueArray, field) => {
        var terms = {};
        terms[field] = [];
        _.each(valueArray, value => {
          if (value !== '*') {
            value.split(',').map(item => {
              terms[field] = _.union(terms[field], _.flatten([item.toUpperCase(), item.toLowerCase()]))
            });
          }
        });
        if (_.size(terms[field]) > 0) {
          authObjValue.push({ terms });
        }
      });
      return authObjValue;
    } else {
      return authObjValue;
    }
  }, function errorCallback(response) {
    return authObjValue;
  }).catch((err) => {
    return authObjValue;
  });
};
