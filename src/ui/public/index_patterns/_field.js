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
        obj.writ('alias', originalField.alias);
      } else {
        obj.writ('alias');
      }

      if (originalField) {
        let selectable = originalField.selectConf && originalField.selectConf.enable;
        obj.fact('selectable', selectable);
        obj.writ('selectConf', originalField.selectConf);
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
