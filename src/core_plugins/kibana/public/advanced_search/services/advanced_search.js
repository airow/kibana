import _ from 'lodash';
import Scanner from 'ui/utils/scanner';
import 'plugins/kibana/dashboard/services/_saved_dashboard';
import uiModules from 'ui/modules';
const module = uiModules.get('apps/advanced_search');

// This is the only thing that gets injected into controllers
module.service('advancedSearch', function (Promise) {
  

  this.syncAdvancedSearch = function (advancedSearch) {
    let returnValue = {};
    returnValue = syncAdvancedSearchCondition(advancedSearch);
    return returnValue;
  }

  this.syncAdvancedSearchCondition = function (boolConditions) {

    let returnValue = {};

    for (let guanxi in boolConditions) {

      let conditions = boolConditions[guanxi];
      let returnValueItem = returnValue[guanxi] = [];

      conditions.forEach(condition => {

        if ('bool' in condition) {

          let childBool = syncAdvancedSearchCondition(condition.bool);

          returnValueItem.push({ "bool": childBool });

        } else {
          if (condition.selected) {
            let selected = condition.selected;

            let fieldName = selected.field.name;
            let fieldVaue = selected.value;
            let operator = selected.operator;

            //处理字符类型 =,like 
            if (operator.strategy) {
              switch (operator.strategy) {
                case ".keyword":
                  if (selected.field.type === "string" && selected.field.hasKeyword) {
                    fieldName = selected.field.asFieldName;
                  }
                  break;
              }
            }

            let newCondition = {};
            let newOperator = {};
            let newLink = {};

            switch (operator.keyword) {
              case "match":
              case "range":
              case "term":
                newCondition[operator.keyword] = newOperator;
                newOperator[fieldName] = newLink;
                newLink[operator.link] = fieldVaue;
                break;
            }

            if (operator.ext) {
              for (let key in operator.ext) {
                newLink[key] = operator.ext[key];
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

    let selected;

    ['match', 'range', 'term'].forEach(keyword => {
      let keys = _.keys(condition[keyword]);
      let fieldName = keys[0];
      if (fieldName) {
        let link = _.keys(condition[keyword][fieldName])[0];
        let selectValue = condition[keyword][fieldName][link];

        let selectField = fieldSource.find(field => { return field.name === fieldName });
        let selectOperator = selectField.typeOperators.find(operator => {
          return operator.keyword === keyword && operator.link === link;
        });
        selected = { value: selectValue, field: selectField, operator: selectOperator };
      }
    });

    return selected;
  }

  this.advancedSearch2UiBind = function (boolConditions, fieldSource) {
    for (let guanxi in boolConditions) {

      let conditions = boolConditions[guanxi];

      conditions.forEach(condition => {

        if ('bool' in condition) {

          advancedSearch2UiBind(condition.bool, fieldSource);

        } else {
          condition.selected = queryField2ViewModel(condition, fieldSource);
        }
      });
    }
    return boolConditions;
  }
});
