import _ from 'lodash';

import { saveAs } from '@spalger/filesaver';

export default function discoverExportExcelService(Private, Promise) {

  function exportExcel(indexPattern, columns, savedSearch, rows) {

    const aliasFields = _.filter(indexPattern.fields, 'alias');
    const aliasMapping = _.transform(aliasFields, (result, value) => {
      return result[value.displayName] = value.alias
    }, {});

    function createSummaryRow(row) {

      // We just create a string here because its faster.
      let exportRow = {};

      if (indexPattern.timeFieldName) {
        //exportRow.push({ text: _displayField(row, indexPattern.timeFieldName) });
        exportRow["time"] = getFiled(row, indexPattern.timeFieldName);
      }

      columns.forEach(function (column) {
        //exportRow.push({ text: _displayField(row, column, true) });
        var columnName = aliasMapping[column] || column;
        exportRow[columnName] = getFiled(row, column, true);
      });

      return exportRow;
    }

    function getFiled(hit, fieldName) {
      let text;
      if (indexPattern.timeFieldName === fieldName) {
        text = indexPattern.formatField(hit, fieldName);
      } else {
        text = getFieldValue(hit, fieldName)
      }
      return text;
    }

    var numberFields = _.map(indexPattern.fields.byType.number, 'asFieldName');

    function getFieldValue(hit, fieldName) {
      let value = hit[fieldName];
      if (!value) {
        value = hit._source[fieldName];
      }
      return value;
    };


    let exportRows = [];
    rows.forEach(function (row, i) {
      exportRows.push(createSummaryRow(row));
    });

    let sheet = {
      name: savedSearch.title,
      columns: [],
      data: exportRows
    };
    _.forEach(sheet.data[0], function (value, key) {
      var intVal = +value;
      var type = _.isNumber(intVal) && _.includes(numberFields, key) && !_.isNaN(intVal) ? 'Number' : 'String';
      var col = { title: key, ss: { type: type } };
      sheet.columns.push(col);
    });

    let dataSource = [sheet];
    saveExecl(dataSource, sheet.name);
  }

  function saveExecl(dataSource, fileName) {

    let execlTemplate = _.template(require('./tmpl.excel.html'));

    let out = execlTemplate({ sheets: dataSource });

    // let xls = new Blob([out], { type: 'application/vnd.ms-excel;charset=utf-8' });
    // saveAs(xls, (fileName||'Export_Execl') + ".xls");

    let xls = new Blob([out], { type: 'application/vnd.ms-excel;charset=utf-8' });
    saveAs(xls, (fileName || 'Export_Execl') + ".xls");
  }


  return exportExcel;
};
