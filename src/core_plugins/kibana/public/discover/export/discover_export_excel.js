import _ from 'lodash';

import RequestQueueProvider from 'ui/courier/_request_queue';
import CallResponseHandlersProvider from 'ui/courier/fetch/call_response_handlers';
import ForEachStrategyProvider from 'ui/courier/fetch/for_each_strategy';

import IsRequestProvider from 'ui/courier/fetch/is_request';
import MergeDuplicatesRequestProvider from 'ui/courier/fetch/merge_duplicate_requests';
import ReqStatusProvider from 'ui/courier/fetch/req_status';

import { saveAs } from '@spalger/filesaver';

export default function discoverExportExcelService(Private, Promise) {

  function exportExcel(indexPattern, state,savedSearch,rows) {
    let columns = state.columns;

    function createSummaryRow(row) {

    // We just create a string here because its faster.
    let exportRow = {};

    if (indexPattern.timeFieldName) {
      //exportRow.push({ text: _displayField(row, indexPattern.timeFieldName) });
      exportRow[indexPattern.timeFieldName] = fff(row, indexPattern.timeFieldName);
    }

    columns.forEach(function (column) {
      //exportRow.push({ text: _displayField(row, column, true) });
      exportRow[column] = fff(row, column, true);
    });

    return exportRow;
  }

  function fff(hit, fieldName) {
    let text;
    if (indexPattern.timeFieldName === fieldName) {
      text = indexPattern.formatField(hit, fieldName);
    } else {
      text = getFieldValue(hit, fieldName)
    }
    return text;
  }

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

    _.forEach(sheet.data[0], function (n, key) {
      sheet.columns.push(key);
    });

    let dataSource = [sheet];
    saveExecl(dataSource,sheet.name);
  }

  function saveExecl(dataSource, fileName) {    

    let execlTemplate = _.template(require('./tmpl.excel.html'));

    let out = execlTemplate({ sheets: dataSource });

    // let xls = new Blob([out], { type: 'application/vnd.ms-excel;charset=utf-8' });
    // saveAs(xls, (fileName||'Export_Execl') + ".xls");

    let xls = new Blob([out], { type: 'text/xml;charset=utf-8' });
    saveAs(xls, (fileName||'Export_Execl') + ".xml");
  }

  
  return exportExcel;
};