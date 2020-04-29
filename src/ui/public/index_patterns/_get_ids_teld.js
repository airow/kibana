import _ from 'lodash';
export default function GetIndexPatternIdsFn(es, kbnIndex) {

  // many places may require the id list, so we will cache it seperately
  // didn't incorportate with the indexPattern cache to prevent id collisions.
  let cachedPromise;

  let getIdsTeld = function () {
    if (cachedPromise) {
      // retrun a clone of the cached response
      return cachedPromise.then(function (cachedResp) {
        return _.clone(cachedResp);
      });
    }

    cachedPromise = es.search({
      index: kbnIndex,
      type: 'index-pattern',
      // storedFields: ["title"],
      body: {
        query: { match_all: {} },
        size: 10000
      }
    })
    .then(function (resp) {
      debugger;
      // return _.pluck(resp.hits.hits, '_id');
      var hits = _.filter(resp.hits.hits, hit => {
        return hit._id === hit._source.title && (window.top === window || '.' != hit._source.title[0]);
      });
      return _.pluck(hits, '_id');
    });

    // ensure that the response stays pristine by cloning it here too
    return cachedPromise.then(function (resp) {
      return _.clone(resp);
    });
  };

  getIdsTeld.clearCache = function () {
    cachedPromise = null;
  };

  return getIdsTeld;
};
