/**
 * @name TeldAggsState
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
let urlParam = '_taggs';

function TeldAggsStateProvider(Private, $rootScope, $location) {
  let State = Private(StateManagementStateProvider);
  let PersistedState = Private(PersistedStatePersistedStateProvider);
  let persistedStates;
  let eventUnsubscribers;

  _.class(TeldAggsState).inherits(State);
  function TeldAggsState(defaults) {
    // Initialize persistedStates. This object maps "prop" names to
    // PersistedState instances. These are used to make properties "stateful".
    persistedStates = {};

    // Initialize eventUnsubscribers. These will be called in `destroy`, to
    // remove handlers for the 'change' and 'fetch_with_changes' events which
    // are dispatched via the rootScope.
    eventUnsubscribers = [];

    TeldAggsState.Super.call(this, urlParam, defaults);
    TeldAggsState.getTeldAggsState._set(this);
  }

  // if the url param is missing, write it back
  TeldAggsState.prototype._persistAcrossApps = false;

  TeldAggsState.prototype.destroy = function () {
    TeldAggsState.Super.prototype.destroy.call(this);
    TeldAggsState.getTeldAggsState._set(null);
    _.callEach(eventUnsubscribers);
  };

  /**
   * @returns PersistedState instance.
   */
  TeldAggsState.prototype.makeStateful = function (prop) {
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

    // if the thing we're making stateful has an TeldAggsState value, write to persisted state
    if (self[prop]) persistedStates[prop].setSilent(self[prop]);

    return persistedStates[prop];
  };

  TeldAggsState.getTeldAggsState = (function () {
    let currentTeldAggsState;

    function get() {
      return currentTeldAggsState;
    }

    // Checks to see if the TeldAggsState might already exist, even if it hasn't been newed up
    get.previouslyStored = function () {
      let search = $location.search();
      return search[urlParam] ? true : false;
    };

    get._set = function (current) {
      currentTeldAggsState = current;
    };

    return get;
  }());

  return TeldAggsState;
}

modules.get('apps/aggs_conf')
.factory('TeldAggsState', function (Private) {
  return Private(TeldAggsStateProvider);
})
.service('getTeldAggsState', function (Private) {
  return Private(TeldAggsStateProvider).getTeldAggsState;
});

export default TeldAggsStateProvider;