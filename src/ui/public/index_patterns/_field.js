import _ from 'lodash';
import ObjDefine from 'ui/utils/obj_define';
import IndexPatternsFieldFormatFieldFormatProvider from 'ui/index_patterns/_field_format/field_format';
import IndexPatternsFieldTypesProvider from 'ui/index_patterns/_field_types';
import RegistryFieldFormatsProvider from 'ui/registry/field_formats';
import IndexPatternsFieldTypeOperatorsProvider from 'ui/index_patterns/_field_type_operators';
export default function FieldObjectProvider(Private, shortDotsFilter, $rootScope, Notifier) {
  let notify = new Notifier({ location: 'IndexPattern Field' });
  let FieldFormat = Private(IndexPatternsFieldFormatFieldFormatProvider);
  let fieldTypes = Private(IndexPatternsFieldTypesProvider);
  let fieldFormats = Private(RegistryFieldFormatsProvider);
  let fieldTypeOperators = Private(IndexPatternsFieldTypeOperatorsProvider);

  function Field(indexPattern, spec) {
    // unwrap old instances of Field
    if (spec instanceof Field) spec = spec.$$spec;

    // constuct this object using ObjDefine class, which
    // extends the Field.prototype but gets it's properties
    // defined using the logic below
    let obj = new ObjDefine(spec, Field.prototype);

    if (spec.name === '_source') {
      spec.type = '_source';
    }

    // find the type for this field, fallback to unknown type
    let type = fieldTypes.byName[spec.type];
    if (spec.type && !type) {
      notify.error(
        'Unknown field type "' + spec.type + '"' +
        ' for field "' + spec.name + '"' +
        ' in indexPattern "' + indexPattern.id + '"'
      );
    }

    if (!type) type = fieldTypes.byName.unknown;

    let format = spec.format;
    if (!format || !(format instanceof FieldFormat)) {
      format = indexPattern.fieldFormatMap[spec.name] || fieldFormats.getDefaultInstance(spec.type);
    }

    let indexed = !!spec.indexed;
    let scripted = !!spec.scripted;
    let sortable = spec.name === '_score' || ((indexed || scripted) && type.sortable);
    let filterable = spec.name === '_id' || scripted || (indexed && type.filterable);
    let searchable = !!spec.searchable || scripted;
    let aggregatable = !!spec.aggregatable || scripted;
    let visualizable = aggregatable;

    /** 2019-03-28 18:25:29
     * 处理text类型字段的排序报错
     * 当前版本逻辑是通过获取索引mapping GET /索引名/_mapping/field/*?ignore_unavailable=false&allow_no_indices=false&include_defaults=true
     * kibana把es里的text、keyword、string都营收为string类型，string定义就似乎可排序了。 也就是说string类型的字段能不能拍下是通过查询mapping对应字段的index是否为true
     * 后调用 GET /_field_stats?fields=*&index=索引名 获取 searchable，aggregatable2个值
     * 在kibana5.6版本中同意是这样的映射关系
     *
     * 区别在于5.6调用的是GET /索引名/_field_caps?fields=*&ignore_unavailable=false&allow_no_indices=false
     * 该方式返回的结果中无index值，值存在
     * {
        "fields": {
          "ExpCode": {
            "keyword": {
              "type": "keyword",
              "searchable": true,
              "aggregatable": true
            }
          }
        }
      }
     * 因返回值无index逻辑就只要根据 aggregatable决定是否可以排序了
     * 5.6 原始代码 “sortable = spec.name === '_score' || ((indexed || aggregatable) && type.sortable);”
     * 因当前版本获取索引index为true固去掉对indexed值的判断
    */
    sortable = spec.name === '_score' || ((aggregatable) && type.sortable);
    /** END 2019-03-28 18:25:29 */

    obj.fact('name');
    obj.fact('type');
    {
      /**2017-03-05 02:13:03
       * 扩展Field对象，用于保存字段字段类型可使用的条件运算符 */
      let findOperators = fieldTypeOperators.byName[spec.type] || fieldTypeOperators.byName.unknown;
      spec.typeOperators = findOperators.operators;
      obj.fact('typeOperators');


      // let selectable = spec.selectConf && spec.selectConf.enable;
      // obj.fact('selectable', selectable);
      // obj.writ('selectConf', selectable ? spec.selectConf : null);

      //obj.writ('alias');
      let originalField = _.find(indexPattern.fields, { name: spec.name });
      if (originalField && originalField.alias) {
        var alias = originalField.alias;
        if (spec.alias !== undefined && alias !== spec.alias) {
          alias = spec.alias;
        }
        obj.writ('alias', alias);
      } else {
        obj.writ('alias');
      }

      if (originalField) {
        let selectable = originalField.selectConf && originalField.selectConf.enable;
        obj.fact('selectable', selectable);
        obj.writ('selectConf', originalField.selectConf);
      }

      if (originalField && originalField.authObjs) {
        var authObjs = originalField.authObjs;
        if (spec.authObjs !== undefined && authObjs !== spec.authObjs) {
          authObjs = spec.authObjs;
        }
        obj.writ('authObjs', authObjs);
      } else {
        obj.writ('authObjs');
      }

      //2019-04-15 query查询的字段 query.query_string.fields
      if (originalField && originalField.isQueryStringField) {
        var isQueryStringField = originalField.isQueryStringField;
        if (spec.isQueryStringField !== undefined && isQueryStringField !== spec.isQueryStringField) {
          isQueryStringField = spec.isQueryStringField;
        }
        obj.writ('isQueryStringField', isQueryStringField);
      } else {
        obj.writ('isQueryStringField');
      }

      //2020-09-16 字段是否可用

      function genExtVal(fieldVal, specVal) {
        var val = fieldVal;
        if (specVal !== undefined && fieldVal !== specVal) {
          val = specVal;
        }
        return val;
      }

      if (originalField) {
        // var disable = originalField.disable;
        // if (spec.disable !== undefined && disable !== spec.disable) {
        //   disable = spec.disable;
        // }
        // obj.fact('disable', disable);

        // setExtVal(obj, 'disable', originalField.disable, spec.disable);
        obj.fact('disable', genExtVal(originalField.disable, spec.disable));
        // obj.fact('disable', genExtVal(indexPattern.fields.byName[spec.name].disable, spec.disable));
      }

    }
    obj.writ('count', spec.count || 0);

    // scripted objs
    obj.fact('scripted', scripted);
    obj.writ('script', scripted ? spec.script : null);
    obj.writ('lang', scripted ? (spec.lang || 'painless') : null);

    // mapping info
    obj.fact('indexed', indexed);
    obj.fact('analyzed', !!spec.analyzed);
    obj.fact('doc_values', !!spec.doc_values);

    // stats
    obj.fact('searchable', searchable);
    obj.fact('aggregatable', aggregatable);

    // usage flags, read-only and won't be saved
    obj.comp('format', format);
    obj.comp('sortable', sortable);
    obj.comp('filterable', filterable);
    obj.comp('visualizable', visualizable);

    // computed values
    obj.comp('indexPattern', indexPattern);
    obj.comp('displayName', shortDotsFilter(spec.name));
    obj.comp('$$spec', spec);

    // conflict info
    obj.writ('conflictDescriptions');

    return obj.create();
  }

  Field.prototype.routes = {
    edit: '/management/kibana/indices/{{indexPattern.id}}/field/{{name}}'
  };

  return Field;
};
