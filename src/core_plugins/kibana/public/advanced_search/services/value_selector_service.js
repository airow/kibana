import _ from 'lodash';
import uiModules from 'ui/modules';
const module = uiModules.get('apps/advanced_search');

// This is the only thing that gets injected into controllers
module.service('valueSelectorService', function (Promise, es, kbnIndex) {

    let caches = {};

    this.getDataSources = function (field) {
        let returnValue = new Promise((resolve, reject) => {
            if (field.selectable) {
                let groupKey = field.selectConf.groupKey;
                if (caches[groupKey]) {
                    resolve(caches[groupKey]);
                } else {
                    es.search({
                        index: (kbnIndex || '.kibana'),
                        type: 'selectConf',
                        body: {
                            size: 1000,
                            query: {
                                term: { groupKey: groupKey }
                            }
                        }
                    }).then(function (resp) {
                        var hits = resp.hits.hits;
                        let returnValue = hits.map(hit => {
                            let id = hit._id;
                            let item = hit._source;
                            let code = item.code;
                            let value = item.value;
                            //let pCode = item.pCode;
                            let pid = item.pid;
                            return { id, pid, code, value };
                        });
                        caches[groupKey] = returnValue;
                        resolve(returnValue);
                    }).catch(err => {
                        resolve();
                        console.trace(err.message);
                    });
                }
            } else {
                reject();
            }
        });
        return returnValue;
    }

    this.getTreeForDueToAnalysis = function (data, primaryIdName, parentIdName) {
        if (!data || data.length == 0 || !primaryIdName || !parentIdName)
            return [];

        var tree = [],
            rootIds = [],
            item = data[0],
            primaryKey = item[primaryIdName],
            treeObjs = {},
            tempChildren = {},
            parentId,
            parent,
            len = data.length,
            i = 0;

        while (i < len) {
            item = data[i++];
            primaryKey = item[primaryIdName];

            if (tempChildren[primaryKey]) {
                item.children = tempChildren[primaryKey];
                delete tempChildren[primaryKey];
            }

            treeObjs[primaryKey] = item;
            parentId = item[parentIdName];

            if (parentId) {
                parent = treeObjs[parentId];

                if (!parent) {
                    var siblings = tempChildren[parentId];
                    if (siblings) {
                        siblings.push(item);
                    }
                    else {
                        tempChildren[parentId] = [item];
                    }
                }
                else if (parent.children) {
                    parent.children.push(item);
                }
                else {
                    parent.children = [item];
                }
            }
            else {
                rootIds.push(primaryKey);
            }
        }

        for (var i = 0; i < rootIds.length; i++) {
            tree.push(treeObjs[rootIds[i]]);
        };

        return tree;
    }
});
