import angular from 'angular';
import ClusterGroupKeyProvider from './cluster_group_key'
export default function ClusterGroupFactory(Private, $http) {

  // let ClusterGroupKey = Private(ClusterGroupKeyProvider);

  function ClusterGroup() {
    let self = this;

    self.ClusterGroupKey = ClusterGroupKeyProvider();
    
    self.isMaster = function () {
      if (self.ClusterGroupKey === "" || window.location.hostname === "localhost") {
        return Promise.resolve(true);
      }
      debugger;
      return $http({
        method: 'GET',
        url: `/bdpgateway/current/${self.ClusterGroupKey}`
      }).then(function successCallback(response) {
        return response.data.master === response.data.conf.active
      }, function errorCallback(response) {
        debugger;
        return false;
      });
    };
  }

  return ClusterGroup;
};
