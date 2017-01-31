import { parse } from 'url';
import { get } from 'lodash';
import 'ui/autoload/styles';
import 'plugins/teld_bdap/views/login/login.less';
import chrome from 'ui/chrome';
import parseNext from 'plugins/teld_bdap/lib/parse_next';
import template from 'plugins/teld_bdap/views/login/login.html';

const messageMap = {
  SESSION_EXPIRED: 'Your session has expired. Please log in again.'
};
console.log("login-------login");
chrome
.setVisible(false)
.setRootTemplate(template)
.setRootController('login', function ($http, $window,$location) {
  const next = parseNext($window.location);
  const isSecure = !!$window.location.protocol.match(/^https/);
  const self = this;

  function setupScope() {
    const defaultLoginMessage = 'Login is currently disabled because the license could not be determined. '
    + 'Please check that Elasticsearch is running, then refresh this page.';

    self.login=()=>{
      alert(1);
      //$window.location.href='http://www.qq.com';
      $location.path("/route");
      //window.location = "#/route";
    };
    self.submit = (username, password) => {
      self.isLoading = true;
      self.error = false;
      $http.post('/api/security/v1/login', {username, password}).then(
        //() => $window.location.href = `.${next}`,
        () => $window.location.href = `${next}`,
        () => {
          setupScope();
          self.error = true;
          self.isLoading = false;
        }
      );
    };
  }

  setupScope();
});
