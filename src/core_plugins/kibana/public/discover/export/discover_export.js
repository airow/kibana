import _ from 'lodash';

import RequestQueueProvider from 'ui/courier/_request_queue';
import CallResponseHandlersProvider from 'ui/courier/fetch/call_response_handlers';
import ForEachStrategyProvider from 'ui/courier/fetch/for_each_strategy';

import IsRequestProvider from 'ui/courier/fetch/is_request';
import MergeDuplicatesRequestProvider from 'ui/courier/fetch/merge_duplicate_requests';
import ReqStatusProvider from 'ui/courier/fetch/req_status';

import { saveAs } from '@spalger/filesaver';

export default function discoverExportService($http, Private, Promise) {

  const forEachStrategy = Private(ForEachStrategyProvider);
  const requestQueue = Private(RequestQueueProvider);
  const callResponseHandlers = Private(CallResponseHandlersProvider);  
  const isRequest = Private(IsRequestProvider);
  const mergeDuplicateRequests = Private(MergeDuplicatesRequestProvider);

  const ABORTED = Private(ReqStatusProvider).ABORTED;
  const DUPLICATE = Private(ReqStatusProvider).DUPLICATE;

  function startRequests(requests) {
    return Promise.map(requests, function (req) {
      if (req === ABORTED) {
        return req;
      }

      return new Promise(function (resolve) {
        const action = req.started ? req.continue : req.start;
        resolve(action.call(req));
      })
      .catch(err => req.handleFailure(err));
    });
  }

  function fetchWithStrategy(strategy, requests) {
    function replaceAbortedRequests() {
      requests = requests.map(r => r.aborted ? ABORTED : r);
    }

    replaceAbortedRequests();
    return startRequests(requests)
      .then(function () {
        replaceAbortedRequests();
        return getClientBody(strategy, requests);
      });
      // .then(function (responses) {
      //   replaceAbortedRequests();
      //   return callResponseHandlers(requests, responses);
      // })
      // .then(function (responses) {
      //   replaceAbortedRequests();
      //   return continueIncomplete(strategy, requests, responses, fetchWithStrategy);
      // })
      // .then(function (responses) {
      //   replaceAbortedRequests();
      //   return responses.map(function (resp) {
      //     switch (resp) {
      //       case ABORTED:
      //         return null;
      //       case DUPLICATE:
      //       case INCOMPLETE:
      //         throw new Error('Failed to clear incomplete or duplicate request from responses.');
      //       default:
      //         return resp;
      //     }
      //   });
      // });
  }  

  function fetchThese(requests) {
    return forEachStrategy(requests, function (strategy, reqsForStrategy) {
      return fetchWithStrategy(strategy, reqsForStrategy.map(function (req) {
        if (!req.started) return req;
        return req.retry();
      }));
    })
    // then(function(d){
    //   console.log(d);
    // });
    .catch(err=>console.log(err));
  }

  function fetchQueued(strategy) {
    const requests = requestQueue.getStartable(strategy);
    if (!requests.length) return Promise.resolve();
    else return fetchThese(requests);
  }

  function getClientBody(strategy, requests) {
    // merging docs can change status to DUPLICATE, capture new statuses
    const statuses = mergeDuplicateRequests(requests);

    // get the actual list of requests that we will be fetching
    const executable = statuses.filter(isRequest);
    let execCount = executable.length;

    if (!execCount) return Promise.resolve([]);

    // // resolved by respond()
    // let esPromise;
    const defer = Promise.defer();

    // // for each respond with either the response or ABORTED
    // const respond = function (responses) {
    //   responses = responses || [];
    //   return Promise.map(requests, function (req, i) {
    //     switch (statuses[i]) {
    //       case ABORTED:
    //         return ABORTED;
    //       case DUPLICATE:
    //         return req._uniq.resp;
    //       default:
    //         return responses[_.findIndex(executable, req)];
    //     }
    //   })
    //   .then(
    //     (res) => defer.resolve(res),
    //     (err) => defer.reject(err)
    //   );
    // };


    // // handle a request being aborted while being fetched
    // const requestWasAborted = Promise.method(function (req, i) {
    //   if (statuses[i] === ABORTED) {
    //     defer.reject(new Error('Request was aborted twice?'));
    //   }

    //   execCount -= 1;
    //   if (execCount > 0) {
    //     // the multi-request still contains other requests
    //     return;
    //   }

    //   if (esPromise && _.isFunction(esPromise.abort)) {
    //     esPromise.abort();
    //   }

    //   esPromise = ABORTED;

    //   return respond();
    // });


    // // attach abort handlers, close over request index
    // statuses.forEach(function (req, i) {
    //   if (!isRequest(req)) return;
    //   req.whenAborted(function () {
    //     requestWasAborted(req, i).catch(defer.reject);
    //   });
    // });


    // Now that all of THAT^^^ is out of the way, lets actually
    // call out to elasticsearch
   
    Promise.map(executable, function (req) {
      return Promise.try(req.getFetchParams, void 0, req)
      .then(function (fetchParams) {
        return (req.fetchParams = fetchParams);
      });
    })
    .then(function (reqsFetchParams) {
      let body = strategy.reqsFetchParamsToBody(reqsFetchParams);
      return body;
    })
    .then(function(body){
      let url = "/elasticsearch/export/_msearch";
      let data = '{"index":["系统运行日志"],"ignore_unavailable":true,"preference":1486962061082}\r\n{"highlight":{"pre_tags":["@kibana-highlighted-field@"],"post_tags":["@/kibana-highlighted-field@"],"fields":{"*":{}},"require_field_match":false,"fragment_size":2147483647},"query":{"bool":{"must":[{"query_string":{"query":"*","analyze_wildcard":true}},{"range":{"CreateTime":{"gte":1486961615159,"lte":1486962515159,"format":"epoch_millis"}}}],"must_not":[]}},"size":500,"sort":[{"_score":{"order":"desc"}}],"_source":{"excludes":[]},"aggs":{"2":{"date_histogram":{"field":"CreateTime","interval":"30s","time_zone":"Asia/Shanghai","min_doc_count":1}}},"stored_fields":["*"],"script_fields":{},"docvalue_fields":["CreateTime"]}\r\n';    
      $http.post(url, body)
        .then(function successCallback(response) {
          console.log(response);
          // this callback will be called asynchronously
          // when the response is available
          exportAsCsv(response,false);

        }, function errorCallback(response) {
          debugger;
          // called asynchronously if an error occurs
          // or server returns response with an error status.
        });
    });
    // .then(function (clientResp) {
    //   return strategy.getResponses(clientResp);
    // })
    // .then(respond)
    // .catch(function (err) {
    //   if (err === ABORTED) respond();
    //   else defer.reject(err);
    // });

    // return our promise, but catch any errors we create and
    // send them to the requests
    return defer.promise
    .catch(function (err) {
      requests.forEach(function (req, i) {
        if (statuses[i] !== ABORTED) {
          req.handleFailure(err);
        }
      });
    });
  }

  this.fetchQueued = fetchQueued;

   function exportAsCsv(data, formatted) {
     let filename = ('export') + '.csv';
     let csv = new Blob([toCsv(data, formatted)], { type: 'text/plain;charset=utf-8' });
     saveAs(csv, filename);
   };

  function toCsv(data,formatted) {
    let rows = data;
    //let columns = formatted ? $scope.formattedColumns : $scope.table.columns;
    let columns = formatted ? $scope.formattedColumns : $scope.table.columns;
    let nonAlphaNumRE = /[^a-zA-Z0-9]/;
    let allDoubleQuoteRE = /"/g;

    function escape(val) {
      if (!formatted && _.isObject(val)) val = val.valueOf();
      val = String(val);
      let quoteValues = config.get('csv:quoteValues');
      if (quoteValues && nonAlphaNumRE.test(val)) {
        val = '"' + val.replace(allDoubleQuoteRE, '""') + '"';
      }
      return val;
    }

    // escape each cell in each row
    let csvRows = rows.map(function (row) {
      return row.map(escape);
    });

    // add the columns to the rows
    csvRows.unshift(columns.map(function (col) {
      return escape(col.title);
    }));

    return csvRows.map(function (row) {
      let separator= config.get('csv:separator');
      return row.join(separator) + '\r\n';
    }).join('');
  };
};