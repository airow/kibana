import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import 'ui/highlight';
import 'ui/highlight/highlight_tags';
import 'ui/doc_viewer';
import 'ui/filters/trust_as_html';
import 'ui/filters/short_dots';
import noWhiteSpace from 'ui/utils/no_white_space';
import openRowHtml from 'ui/doc_table/components/table_row/open.html';
import sendPostMessageRowHtml from 'ui/doc_table/components/table_row/sendPostMessage.html';
import detailsHtml from 'ui/doc_table/components/table_row/details.html';
import uiModules from 'ui/modules';
let module = uiModules.get('app/discover');



// guesstimate at the minimum number of chars wide cells in the table should be
let MIN_LINE_LENGTH = 20;

/**
 * kbnTableRow directive
 *
 * Display a row in the table
 * ```
 * <tr ng-repeat="row in rows" kbn-table-row="row"></tr>
 * ```
 */
module.directive('kbnTableRow', function ($compile, advancedSearch, TeldState) {
  let cellTemplate = _.template(noWhiteSpace(require('ui/doc_table/components/table_row/cell.html')));
  let truncateByHeightTemplate = _.template(noWhiteSpace(require('ui/partials/truncate_by_height.html')));
  //let moment = require('moment');


  return {
    restrict: 'A',
    scope: {
      columns: '=',
      filter: '=',
      indexPattern: '=',
      row: '=kbnTableRow',
      rowIndex: '=?',
      savedObj: '=?'
    },
    controller: function ($scope, advancedSearch, TeldState, globalState, teldSession, timefilter) {
      $scope.$TeldState = new TeldState();
      $scope.advancedSearch = advancedSearch;
      $scope.sendPostMessage = function () {
        debugger;
        let postData = {
          "response": "I'm kibana", "row": this.row,
          TeldState: $scope.$TeldState, advancedSearch: $scope.advancedSearch
        };
        this.$emit('$messageOutgoing', angular.toJson(postData));
      }

      $scope.rowSelected = function () {
        if (this.$root.embedded) {
          if (this.$root.embedded.selectRowId != this.row._id) {
            this.$root.embedded.selectRowId = this.row._id;
          } else {
            this.$root.embedded.selectRowId = null
          }

          let postMessage = {
            "eventType": "kibana.RowSelected",
            "eventArgs": {
              "row": this.row,
              "timeRange": timefilter.getActiveBounds(),
              "advancedSearch": $scope.advancedSearch,
              "TeldState": $scope.$TeldState,
              "isSelected": this.$root.embedded.selectRowId !== null
            }
          };
          console.log(postMessage);
          this.$emit('$messageOutgoing', angular.toJson(postMessage));
        }
      }
    },
    link: function ($scope, $el) {
      $el.after('<tr>');
      $el.empty();

      // when we compile the details, we use this $scope
      let $detailsScope;

      // when we compile the toggle button in the summary, we use this $scope
      let $toggleScope;

      // toggle display of the rows details, a full list of the fields from each row
      $scope.toggleRow = function () {
        let $detailsTr = $el.next();

        $scope.open = !$scope.open;

        ///
        // add/remove $details children
        ///

        $detailsTr.toggle($scope.open);

        if (!$scope.open) {
          // close the child scope if it exists
          $detailsScope.$destroy();
          // no need to go any further
          return;
        } else {
          $detailsScope = $scope.$new();
        }

        // empty the details and rebuild it
        $detailsTr.html(detailsHtml);

        $detailsScope.row = $scope.row;

        $compile($detailsTr)($detailsScope);
      };

      // $scope.sendPostMessage = function(){
      //     debugger;
      //     this.$emit('$messageOutgoing', angular.toJson({"response" : "I'm kibana","row":this.row}));
      // }
      //嵌入模式，默认选择
      if ($scope.$root.embedded && $scope.rowIndex === $scope.$root.initRowSelectIndex) {
        $scope.rowSelected();
      }


      $scope.$watchMulti([
        'indexPattern.timeFieldName',
        'row.highlight',
        '[]columns'
      ], function () {
        createSummaryRow($scope.row, $scope.row._id);
      });

      // create a tr element that lists the value for each *column*
      function createSummaryRow(row) {
        let indexPattern = $scope.indexPattern;

        // We just create a string here because its faster.
        let newHtmls = [
          openRowHtml,
          sendPostMessageRowHtml
        ];

        if (indexPattern.timeFieldName) {
          newHtmls.push(cellTemplate({
            timefield: true,
            formatted: _displayField(row, indexPattern.timeFieldName)
          }));
        }

        $scope.columns.forEach(function (column) {
          newHtmls.push(cellTemplate({
            timefield: false,
            sourcefield: (column === '_source'),
            formatted: _displayField(row, column, true)
          }));
        });

        let $cells = $el.children();
        newHtmls.forEach(function (html, i) {
          let $cell = $cells.eq(i);
          if ($cell.data('discover:html') === html) return;

          let reuse = _.find($cells.slice(i + 1), function (cell) {
            return $.data(cell, 'discover:html') === html;
          });

          let $target = reuse ? $(reuse).detach() : $(html);
          $target.data('discover:html', html);
          let $before = $cells.eq(i - 1);
          if ($before.size()) {
            $before.after($target);
          } else {
            $el.append($target);
          }

          // rebuild cells since we modified the children
          $cells = $el.children();

          if (i === 0 && !reuse) {
            $toggleScope = $scope.$new();
            $compile($target)($toggleScope);
          }
          if (i === 1 && !reuse) {
            $toggleScope = $scope.$new();
            $compile($target)($toggleScope);
          }
        });

        if ($scope.open) {
          $detailsScope.row = row;
        }

        // trim off cells that were not used rest of the cells
        $cells.filter(':gt(' + (newHtmls.length - 1) + ')').remove();
        $el.trigger('renderComplete');
      }

      var columnConfCache = {};

      function cac(column) {
        let returnValue = {
          disable: column.disable,
          template: _.template('${value}'),
          defStrategy: function (value, row, fieldName) {
            var val = { value: value, color: '' };
            return val;
          },
          customStrategy: {
            custom: function (value, row, fieldName, styleString, funStrategy) {
              var funName = funStrategy || funStrategy.strategy || 'custom';
              var obj = this[funName](value, row, fieldName);
              value = new String(_.template('${value}')(obj));
              var style = [(this.style || '') + styleString];
              if (obj.color !== '') {
                if (this.bgColor) {
                  style.push('background-color:' + obj.color);
                } else {
                  style.push('color:' + obj.color);
                }
              } else {
                if (this.bgColor) { style.push('color: inherit !important'); }
              }
              if (obj.style) {
                var styleObj = _.transform(style, (result, value, key) => {
                  _.each(_.remove(value.split(";")), item => {
                    var v = item.split(":");
                    result[_.trim(v[0])] = v[1];
                  });
                }, {});
                styleObj = _.defaults(obj.style, styleObj);
                value.style = _.map(styleObj, (value, key) => { return `${key}:${value};` });
                value.style = value.style.join("");
              }
              if (obj.value) {
                debugger;
                // value = obj.value;
                value = _.assign(new String(obj.value), value);
              }
              return value;
            }
          },
          execOriginalStrategy: function (value, row, fieldName, styleString, funStrategy) {
            var color = this[funStrategy || 'defStrategy'](value, row, fieldName);
            var style = [this.style || ''];
            value = new String(this.template(color));
            if (color.color !== '') {
              if (this.bgColor) {
                style.push('background-color:' + color.color);
              } else {
                style.push('color:' + color.color);
              }
            } else {
              if (this.bgColor) { style.push('color: inherit !important'); }
            }
            value.style = style.join(';');
            return value;
          },
          exec: function (value, row, fieldName, styleString) {
            value = value.replace('<mark>', '').replace('</mark>', '');

            switch (this.strategy) {
              case "custom":
                var customFun = this.customStrategy[this.strategy];
                if (customFun) {
                  customFun = customFun.bind(this);
                  value = customFun(value, row, fieldName, styleString, this.strategy)
                }
                break;
              case "JS":
                value = this.customStrategy['custom'].bind(this)(value, row, fieldName, styleString, 'expressionObj');
                break;
              default:
                value = this.execOriginalStrategy(value, row, fieldName, styleString, this.strategy);
                break;
            }
            return value;
          }

        };
        if (column.coloring) {
          returnValue.disable = column.disable;
          returnValue.strategy = column.coloring.strategy;
          returnValue.bgColor = column.coloring.bgColor;
          returnValue.style = column.style;
          returnValue.config = _.pick(column.coloring, ['editorForm', 'ranges', 'expression', 'expressionObj', 'thresholds', 'enumeration', 'custom']);
          returnValue.template = _.template(column.coloring.template || '${value}');
          returnValue.enumeration = function (value, row, fieldName) {
            var val = { value: value, color: '' };
            if (!this.config.enumeration) {
              return val;
            }

            var item = _.find(this.config.enumeration, { value: value });
            if (item) {
              val.value = item.text;
              val.color = item.color || '';
            }
            return val;
          };
          returnValue.expression = function (value, row, fieldName) {
            var val = { value: value, color: '' };
            var fun = new Function('value', 'row', 'fieldName', this.config.expression.body);
            val.color = fun(value, row, fieldName);
            return val;
          };
          returnValue.expressionObj_bak = function (value, row, fieldName) {
            var val = { value: value, color: '' };
            var fun = new Function('value', 'row', 'fieldName', this.config.expressionObj.body);
            var opts = fun(value, row, fieldName);
            if (_.isObject(opts)) {
              val = _.defaults(opts, val);
            } else {
              val.color = opts;
            }
            return val;
          };
          returnValue.expressionObj = function (value, row, fieldName) {
            var val = this.custom(value, row, fieldName, this.config.expressionObj);
            return val;
          };
          returnValue.custom = function (value, row, fieldName, configOpt) {
            var val = { value: value, color: '' };
            configOpt = configOpt || this.config.custom;
            var fun = new Function('value', 'row', 'fieldName', configOpt.fun || configOpt.body);
            var opts = fun(value, row, fieldName);
            if (_.isObject(opts)) {
              val = _.defaults(opts, val);
            } else {
              val.color = opts;
            }
            return val;
          };
          returnValue.thresholds = function (value, row, fieldName) {
            var val = { value: value, color: '' };
            if (!this.config.thresholds) {
              return val;
            }
            _.each(this.config.thresholds, item => {
              if (value >= item.value) {
                val.color = item.color;
              }
            });
            return val;
          };
          returnValue.ranges = function (value, row, fieldName) {
            var val = { value: value, color: '' };
            if (!this.config.ranges) {
              return val;
            }
            _.each(this.config.ranges, item => {
              var range = item.range;
              var color = item.color;
              range = _.toArray(range.replace(/\s/g, ''));
              var head = range.shift();
              var last = range.pop();
              range = range.join('');
              var values = range.split(/,|TO/);
              var minStr = values[0];
              var maxStr = values[1];
              var min = +minStr;
              var max = +maxStr;
              value = +value;

              if (minStr === maxStr === '*') {
                val.color = color;
                return false;
              }

              var minStatus = minStr === '*';
              if (minStatus === false) {
                switch (head) {
                  case '[':
                    minStatus = min <= value;
                    break;
                  case '(':
                    minStatus = min < value;
                    break;
                }
              }
              var maxStatus = maxStr === '*';
              if (maxStatus === false) {
                switch (last) {
                  case ']':
                    maxStatus = max >= value;
                    break;
                  case ')':
                    maxStatus = max > value;
                    break;
                }
              }
              if (minStatus && maxStatus) {
                val.color = color;
                return false;
              }
            });
            return val;
          };
          returnValue.editorForm = function (value, row, fieldName) {
            var val = { value: "<div ng-click='editorRow()'>" + value + "</div>", color: '' };
            return val;
          };
        }
        return returnValue;
      }


      function columnConf_bak(value, row, fieldName) {
        let columnConf = _.get($scope, '$parent.savedObj.uiConf.columnConf');
        if (!columnConf) {
          return value;
        }

        let column = columnConfCache[fieldName];
        if (!column) {
          let colConf = _.find(columnConf, { fieldName: fieldName });
          if (!colConf || colConf.disable) {
            return value;
          }
          column = columnConfCache[fieldName] = cac(colConf);
        }
        if (column.disable) {
          return value;
        }

        value = column.exec(value, row, fieldName);
        return value;
      }

      function columnConf(value, row, fieldName) {

        let columnConf = _.get($scope, '$parent.savedObj.uiConf.columnConf');
        if (!columnConf) {
          return value;
        }
        // debugger;
        let columns = columnConfCache[fieldName];
        if (!columns) {
          let colConf = _.filter(columnConf, item => { return item.fieldName == fieldName && item.disable == false || item.rowStyle; });
          columns = columnConfCache[fieldName] = _.map(colConf, item => { return cac(item) });
        }

        var styleString = "";
        _.each(columns, column => {
          value = column.exec(value, row, fieldName, styleString);
          styleString = value.style;
        });
        return value;
      }

      /**
       * Fill an element with the value of a field
       */
      function _displayField(row, fieldName, truncate) {
        let indexPattern = $scope.indexPattern;
        /*
        合并到 src\ui\public\stringify\types\url.js文件
        Url.prototype._formatTemplate方法处理
        urlFormat(indexPattern, fieldName, row); // 对rul格式化特殊处理，支持row数据
        */
        let text = indexPattern.formatField(row, fieldName);

        //字段着色、枚举转换、单元格样式
        text = columnConf(text, row._source, fieldName);

        if (truncate && text.length > MIN_LINE_LENGTH) {
          if (text instanceof String) {
            var truncateText = truncateByHeightTemplate({
              body: text
            });
            return _.defaults(new String(truncateText), text);
          } else {
            return truncateByHeightTemplate({
              body: text
            });
          }
        }
        return text;
      }

      var urlFormatHelper = {
        date: {
          now: function () { return moment(); },
          addHours: function (val, set) {
            return moment(val).add(set, 'h');
          },
          addMinutes: function (val, set) {
            return moment(val).add(set, 'm');
          },
          addDays: function (val, set) {
            return moment(val).add(set, 'd');
          }
        }
      };

      function urlFormat(indexPattern, fieldName, row) {
        let field = indexPattern.fields.byName[fieldName];
        //let field = _.find(indexPattern.fields, { name: fieldName });
        if (field && field.format && field.format.type) {
          switch (field.format.type.id) {
            case 'url':

              //let confUrlTemplate = field.format._params.confUrlTemplate = field.format._params.confUrlTemplate || field.format._params.urlTemplate;
              if (field.format._params.confUrlTemplate === undefined) {
                field.format._params.confUrlTemplate = field.format._params.urlTemplate;
              }
              let confUrlTemplate = field.format._params.confUrlTemplate;

              field.format._params.urlTemplate = _.template(confUrlTemplate, { imports: { moment: moment, helper: urlFormatHelper } })(row);
              break;
          }
        }
      }
    }
  };
});
