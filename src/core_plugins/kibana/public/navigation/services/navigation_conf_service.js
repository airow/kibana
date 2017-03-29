import _ from 'lodash';
import uiModules from 'ui/modules';
const module = uiModules.get('apps/advanced_search');

// This is the only thing that gets injected into controllers
module.service('navigationConfService', function (Promise, es, kbnIndex) {

    let caches = {};

    this.get = function (ids) {
        ids = ids || [];

        let returnValue = new Promise((resolve, reject) => {

            let navigationConfs = {};
            let body = {
                ids: []
            }            
            ids.forEach(id => {
                let nav = caches[id];
                if (nav) {
                    navigationConfs[id] = nav;
                } else {
                    body.ids.push(id);
                }
            });

            if (body.ids.length > 0) {
                es.mget({
                    index: (kbnIndex || '.kibana'),
                    type: 'navigationConf',
                    body
                }).then(function (resp) {
                    resp.docs.forEach(doc => {
                        if (doc.found) {
                            let id = doc._id;
                            let navigation = doc._source.navigation;
                            navigationConfs[id] = caches[id] = navigation;
                        }
                    });

                    resolve(navigationConfs);
                }).catch(err => {
                    reject(err.message);
                    console.trace(err.message);
                });
            } else {
                // if (true) {
                //     resolve(navigationConfs);
                // } else {
                //     reject('没有关联的conf');
                // }
                resolve(navigationConfs);
            }            
        });
        return returnValue;
    }
});
