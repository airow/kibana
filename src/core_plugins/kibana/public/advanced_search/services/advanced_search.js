import _ from 'lodash';
import moment from 'moment';
import Scanner from 'ui/utils/scanner';
import 'plugins/kibana/dashboard/services/_saved_dashboard';
import uiModules from 'ui/modules';
const module = uiModules.get('apps/advanced_search');

// This is the only thing that gets injected into controllers
module.service('advancedSearch', function (Promise, getAppState) {

  this.fieldTypes = ["string", "number", "date", "boolean"];

  this.getFieldSource = function (indexPattern) {
    let appState = getAppState();
    let columns = appState && appState.columns ? appState.columns : [];
    let aliasColumns = [];

    let that = this;
    let fields = indexPattern.fields;
    let metaFields = indexPattern.metaFields;
    let timeFieldName = indexPattern.timeFieldName;

    let keywords = {};

    let fieldSource = fields.filter(field => {

      //let returnValue = metaFields.indexOf(field.name) < 0 && field.searchable && field.analyzed == false;
      let returnValue = metaFields.indexOf(field.name) < 0 && field.searchable;

      if (returnValue) {
        switch (field.type) {
          default:
            returnValue = false;
            break;
          case "date":
            returnValue = !(field.name == timeFieldName);
            break;
          case "string":
          case "number":
          case "boolean":
            break;
        }
      }
      return returnValue;
    }).map(field => {
      field.asFieldName = field.name;
      //对字符穿类型进行特殊处理 =，like
      if (field.type === "string") {
        field.hasKeyword = _.endsWith(field.name, '.keyword');
        if (field.hasKeyword) {
          field.asFieldName = field.name.replace('.keyword', '');
          //keywords.push(field.asFieldName);
          keywords[field.asFieldName] = field.asFieldName;
          // if (field.typeOperators.length == 1) {
          //   field.typeOperators.push({ display: "等于", keyword: "match", link: "query", ext: { "type": "phrase" } });
          // }
        }
      }
      return field;
    }).filter(field => {
      let returnValue = true;
      if (keywords[field.name] && false === field.hasKeyword) {
        returnValue = false;
      }
      if (field.alias) {
        aliasColumns.push(field.name);
      }
      return returnValue;
    });

    /*设置了别名的字段靠前显示*/
    //fieldSource = _.sortByOrder(fieldSource, ['alias'], ['asc']);
    /**
     * 排序，用户定义的字段排在前边
     */
    columns = _.uniq(columns.concat(aliasColumns));
    let masterFieldNameMapping = {};
    let secondaryFields = fieldSource.filter(field => {
      let findKey = field.asFieldName || field.name;
      let returnValue = _.indexOf(columns, findKey) < 0;
      if (returnValue === false) {
        masterFieldNameMapping[findKey] = field;
      }
      return returnValue;
    });

    let masterFields = [];
    columns.forEach(function (column) {
      let field = masterFieldNameMapping[column];
      if (field) { masterFields.push(field); }
    });
    let sortFields = masterFields.concat(secondaryFields);
    return sortFields;
  }

  this.syncAdvancedSearch = function (advancedSearch) {
    let returnValue = {};
    returnValue = this.syncAdvancedSearchCondition(advancedSearch, false);
    return returnValue;
  }

  this.syncAdvancedSearch2EsQueryDSL = function (advancedSearch) {
    let returnValue = {};
    try {
      returnValue = this.syncAdvancedSearchCondition(advancedSearch, true);
    } catch (err) {
      alert(err);
      returnValue = false;
    }
    return returnValue;
  }

  this.filterOperator = function (field) {
    let returnValue = [];
    if (field) {
      returnValue = field.typeOperators;

      switch (field.type) {
        case "string":
          if (false == field.hasKeyword && field.analyzed) {
            returnValue = [field.typeOperators.find(operator => {
              return operator.operatorKey === "string_contain";
            })];
          }
          // if (false == field.hasKeyword) {

          //   let operatorKey = "string_equal";
          //   if (field.analyzed) {
          //     operatorKey = "string_contain";
          //   }

          //   // returnValue = [field.typeOperators.find(operator => {
          //   //   return operator.operatorKey === operatorKey;
          //   // })];

          //   // returnValue = [field.typeOperators.find(operator => {
          //   //   return operator.operatorKey === 'string_equal' || operator.operatorKey === 'string_contain';
          //   // })];
          // }
          break;
      }
    }
    return returnValue;
  }

  this.syncAdvancedSearchCondition = function (boolConditions, isEsQueryDSL) {

    isEsQueryDSL = isEsQueryDSL || false;

    let that = this;

    let returnValue = {};

    for (let guanxi in boolConditions) {

      let conditions = boolConditions[guanxi];
      let returnValueItem = returnValue[guanxi] = [];

      conditions.forEach(condition => {

        if ('bool' in condition) {

          let childBool = that.syncAdvancedSearchCondition(condition.bool, isEsQueryDSL);

          returnValueItem.push({ "bool": childBool });

        } else {
          if (condition.selected) {
            let selected = condition.selected;
            if (isEsQueryDSL && selected.disabled) { return; }

            let fieldName = selected.field.name;
            let fieldVaue = selected.value;
            let operator = selected.operator;

            let operatorExt = _.clone(operator.ext);

            //处理字符类型 =,like
            if (operator.strategy) {
              switch (operator.strategy) {
                case ".keyword":
                  if (selected.field.type === "string" && selected.field.hasKeyword) {
                    fieldName = selected.field.asFieldName;
                  }
                  break;
                case "date":
                  if (_.isDate(fieldVaue)) {
                    fieldVaue = parseInt(moment(fieldVaue).format('x'));
                  } else {
                    fieldVaue = parseInt(moment(fieldVaue).format('x'));
                  }
                  break;
                case "date_equal":
                  if (_.isDate(fieldVaue)) {
                    fieldVaue = parseInt(moment(fieldVaue).format('x'));
                  } else {
                    fieldVaue = parseInt(moment(fieldVaue).format('x'));
                  }
                  operatorExt.lte = fieldVaue;

                  break;
              }
            }

            let newCondition = {};
            if (isEsQueryDSL === false) {
              newCondition = _.pick(condition, ['embed']);
            }
            let newOperator = {};
            let newLink = {};

            switch (operator.keyword) {
              case "teld_contain":  //包含
                if (selected.field.analyzed) {
                  newCondition["match"] = newOperator;
                  newOperator[fieldName] = newLink;
                  if (false == isEsQueryDSL) {
                    newOperator.conf = {
                      "disabled": selected.disabled,
                      "operatorKey": operator.operatorKey
                    };
                  }
                  newLink["query"] = fieldVaue;
                } else {
                  newCondition["wildcard"] = newOperator;
                  newOperator[fieldName] = `*${fieldVaue}*`;
                  if (false == isEsQueryDSL) {
                    newOperator.conf = {
                      "disabled": selected.disabled,
                      "operatorKey": operator.operatorKey
                    };
                  }
                }
                break;

              case "match":
              case "match_phrase":
              case "range":
              case "term":
                newCondition[operator.keyword] = newOperator;
                newOperator[fieldName] = newLink;
                if (false == isEsQueryDSL) {
                  newOperator.conf = {
                    "disabled": selected.disabled,
                    "operatorKey": operator.operatorKey
                  };
                }
                newLink[operator.link] = fieldVaue;
                break;
              case "wildcard_bak":
                newCondition[operator.keyword] = newOperator;
                //fieldVaue = (fieldVaue || "").toLowerCase();
                //newOperator[fieldName] = `*${fieldVaue}*`;
                newOperator[fieldName] = fieldVaue;
                if (false == isEsQueryDSL) {
                  newOperator.conf = {
                    "disabled": selected.disabled,
                    "operatorKey": operator.operatorKey
                  };
                }
                //newLink[operator.link] = fieldVaue;
                break;
            }

            if (operatorExt) {
              for (let key in operatorExt) {
                newLink[key] = operatorExt[key];
              }
            }
            returnValueItem.push(newCondition);
          }
        }
      });
    }

    return returnValue;
  }

  this.queryField2ViewModel = function (condition, fieldSource) {

    // if (condition.selected.field.hasKeyword) {
    //   condition.selected.field.typeOperators.push({ display: "等于", keyword: "match", link: "query", ext: { "type": "phrase" } });
    // }

    let selected;

    ['match', 'range', 'term'].forEach(keyword => {
      let keys = _.keys(condition[keyword]);
      let fieldName = keys.find(key => { return key !== "conf" });
      if (fieldName) {
        let link = _.keys(condition[keyword][fieldName])[0];
        let selectValue = condition[keyword][fieldName][link];

        let selectField = fieldSource.find(field => { return field.asFieldName === fieldName || field.name === fieldName });

        let conf = condition[keyword]["conf"] || {};

        let selectOperator = selectField.typeOperators.find(operator => {
          return operator.operatorKey === conf.operatorKey;
        });
        selected = { value: selectValue, field: selectField, operator: selectOperator, disabled: conf.disabled };
      }
    });

    ['wildcard'].forEach(keyword => {
      let keys = _.keys(condition[keyword]);
      let fieldName = keys.find(key => { return key !== "conf" });
      if (fieldName) {
        //let link = _.keys(condition[keyword][fieldName])[0];
        let selectValue = condition[keyword][fieldName];
        let r = /\*(.*)\*/.exec(selectValue);
        if (r) {
          selectValue = r[1];
        }

        let selectField = fieldSource.find(field => { return field.asFieldName === fieldName || field.name === fieldName });

        let conf = condition[keyword]["conf"] || {};

        let selectOperator = selectField.typeOperators.find(operator => {
          return operator.operatorKey === conf.operatorKey;
        });
        selected = { value: selectValue, field: selectField, operator: selectOperator, disabled: conf.disabled };
      }
    });

    return selected;
  }

  this.advancedSearch2UiBind = function (boolConditions, fieldSource) {

    let that = this;

    for (let guanxi in boolConditions) {

      let conditions = boolConditions[guanxi];

      conditions.forEach(condition => {

        if ('bool' in condition) {

          that.advancedSearch2UiBind(condition.bool, fieldSource);

        } else {
          condition.selected = that.queryField2ViewModel(condition, fieldSource);
        }
      });
    }
    return boolConditions;
  }
});
