/**
 * @name TeldState
 *
 * @extends State
 *
 * @description Inherits State, which inherits Events. This class seems to be
 * concerned with mapping "props" to PersistedState instances, and surfacing the
 * ability to destroy those mappings.
 */

import _ from 'lodash';
import modules from 'ui/modules';
import StateManagementStateProvider from 'ui/state_management/state';
import PersistedStatePersistedStateProvider from 'ui/persisted_state/persisted_state';
let urlParam = '_ts';

function TeldStateProvider(Private, $rootScope, $location) {
  let State = Private(StateManagementStateProvider);
  let PersistedState = Private(PersistedStatePersistedStateProvider);
  let persistedStates;
  let eventUnsubscribers;

  _.class(TeldState).inherits(State);
  function TeldState(defaults) {
    // Initialize persistedStates. This object maps "prop" names to
    // PersistedState instances. These are used to make properties "stateful".
    persistedStates = {};

    // Initialize eventUnsubscribers. These will be called in `destroy`, to
    // remove handlers for the 'change' and 'fetch_with_changes' events which
    // are dispatched via the rootScope.
    eventUnsubscribers = [];

    TeldState.Super.call(this, urlParam, defaults);
    TeldState.getTeldState._set(this);
  }

  // if the url param is missing, write it back
  TeldState.prototype._persistAcrossApps = false;

  TeldState.prototype.destroy = function () {
    TeldState.Super.prototype.destroy.call(this);
    TeldState.getTeldState._set(null);
    _.callEach(eventUnsubscribers);
  };

  /**
   * @returns PersistedState instance.
   */
  TeldState.prototype.makeStateful = function (prop) {
    if (persistedStates[prop]) return persistedStates[prop];
    let self = this;

    // set up the ui state
    persistedStates[prop] = new PersistedState();

    // update the app state when the stateful instance changes
    let updateOnChange = function () {
      let replaceState = false; // TODO: debouncing logic
      self[prop] = persistedStates[prop].getChanges();
      // Save state to the URL.
      self.save(replaceState);
    };
    let handlerOnChange = (method) => persistedStates[prop][method]('change', updateOnChange);
    handlerOnChange('on');
    eventUnsubscribers.push(() => handlerOnChange('off'));

    // update the stateful object when the app state changes
    let persistOnChange = function (changes) {
      if (!changes) return;

      if (changes.indexOf(prop) !== -1) {
        persistedStates[prop].set(self[prop]);
      }
    };
    let handlePersist = (method) => this[method]('fetch_with_changes', persistOnChange);
    handlePersist('on');
    eventUnsubscribers.push(() => handlePersist('off'));

    // if the thing we're making stateful has an TeldState value, write to persisted state
    if (self[prop]) persistedStates[prop].setSilent(self[prop]);

    return persistedStates[prop];
  };

  TeldState.getTeldState = (function () {
    let currentTeldState;

    function get() {
      return currentTeldState;
    }

    // Checks to see if the TeldState might already exist, even if it hasn't been newed up
    get.previouslyStored = function () {
      let search = $location.search();
      return search[urlParam] ? true : false;
    };

    get._set = function (current) {
      currentTeldState = current;
    };

    return get;
  }());

  return TeldState;
}

modules.get('apps/advanced_search')
.factory('TeldState', function (Private) {
  return Private(TeldStateProvider);
})
.service('getTeldState', function (Private) {
  return Private(TeldStateProvider).getTeldState;
})
.service('teldSession', function (TeldState,getTeldState) {
  let _ts = getTeldState() || new TeldState();
  let user = {};

  let pageState = {};

  this.init = function (state) {
    for (let key in state) {
      if (!pageState[key]) {
        pageState[key] = state[key];
      }
    }
  }

  this.getPageState = function (key) {
    return pageState[key] || '';
  }

  this.setPageState = function (key, value) {
    pageState[key] = value;
  }

  this.getUser = function () {
    if (_.isEmpty(user)) {
      user = _ts.s;
    }
    return user;
  }

  this.setSavedObjOwner = function (savedObj) {
    let returnValue = false;
    if (user && user.UserId) {
      savedObj.id = `${savedObj.title}@${user.UserId}@${user.UserName}`;
      if (!savedObj.uiConf.owner || savedObj.uiConf.owner.length === 0) {        
        savedObj.uiConf.owner = [user];
        returnValue = true;
      }
    }
    return returnValue;
  }

  this.getUserId = function () {
    return (this.getUser() || { UserId: "" }).UserId;
  }
});

export default TeldStateProvider;



/** WEBPACK FOOTER **
 ** ./src/core_plugins/kibana/public/advanced_search/state/teld_state.js
 **/


/** WEBPACK FOOTER **
 ** ./src/core_plugins/kibana/public/advanced_search/state/teld_state.js
 **/