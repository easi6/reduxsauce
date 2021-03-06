'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var isNil = _interopDefault(require('ramda/src/isNil'));
var is = _interopDefault(require('ramda/src/is'));
var has = _interopDefault(require('ramda/src/has'));
var any = _interopDefault(require('ramda/src/any'));
var equals = _interopDefault(require('ramda/src/equals'));
var keys = _interopDefault(require('ramda/src/keys'));
var pipe = _interopDefault(require('ramda/src/pipe'));
var trim = _interopDefault(require('ramda/src/trim'));
var merge = _interopDefault(require('ramda/src/merge'));
var split = _interopDefault(require('ramda/src/split'));
var reject = _interopDefault(require('ramda/src/reject'));
var map = _interopDefault(require('ramda/src/map'));
var fromPairs = _interopDefault(require('ramda/src/fromPairs'));
var anyPass = _interopDefault(require('ramda/src/anyPass'));
var isEmpty = _interopDefault(require('ramda/src/isEmpty'));
var join = _interopDefault(require('ramda/src/join'));
var mapObjIndexed = _interopDefault(require('ramda/src/mapObjIndexed'));
var pick = _interopDefault(require('ramda/src/pick'));
var replace = _interopDefault(require('ramda/src/replace'));
var toUpper = _interopDefault(require('ramda/src/toUpper'));
var zipObj = _interopDefault(require('ramda/src/zipObj'));
var filter = _interopDefault(require('ramda/src/filter'));
var mergeAll = _interopDefault(require('ramda/src/mergeAll'));
var curry = _interopDefault(require('ramda/src/curry'));

var DEFAULT = 'REDUXSAUCE.DEFAULT';

var Types = Object.freeze({
	DEFAULT: DEFAULT
});

/**
  Creates a reducer.
  @param {string} initialState - The initial state for this reducer.
  @param {object} handlers - Keys are action types (strings), values are reducers (functions).
  @return {object} A reducer object.
 */
var cr = (function (initialState, handlers) {
  // initial state is required
  if (isNil(initialState)) {
    throw new Error('initial state is required');
  }

  // handlers must be an object
  if (isNil(handlers) || !is(Object, handlers)) {
    throw new Error('handlers must be an object');
  }

  // handlers cannot have an undefined key
  if (any(equals('undefined'))(keys(handlers))) {
    throw new Error('handlers cannot have an undefined key');
  }

  // create the reducer function
  return function () {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : initialState;
    var action = arguments[1];

    // wrong actions, just return state
    if (isNil(action)) return state;
    if (!has('type', action)) return state;

    // look for the handler
    var handler = handlers[action.type] || handlers[DEFAULT];

    // no handler no cry
    if (isNil(handler)) return state;

    // execute the handler
    return handler(state, action);
  };
});

var isNilOrEmpty = anyPass([isNil, isEmpty]);

var defaultOptions = {
  prefix: ''
};

var createTypes$1 = (function (types) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (isNilOrEmpty(types)) throw new Error('valid types are required');

  var _merge = merge(defaultOptions, options),
      prefix = _merge.prefix;

  return pipe(trim, split(/\s/), map(trim), reject(isNilOrEmpty), map(function (x) {
    return [x, prefix + x];
  }), fromPairs)(types);
});

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

var defaultOptions$1 = {
  prefix: ''

  // matches on capital letters (except at the start & end of the string)
};var RX_CAPS = /(?!^)([A-Z])/g;

// converts a camelCaseWord into a SCREAMING_SNAKE_CASE word
var camelToScreamingSnake = pipe(replace(RX_CAPS, '_$1'), toUpper);

// build Action Types out of an object
var convertToTypes = function convertToTypes(config, options) {
  var opts = merge(defaultOptions$1, options);
  return pipe(keys, // just the keys
  map(camelToScreamingSnake), // CONVERT_THEM
  join(' '), // space separated
  function (types) {
    return createTypes$1(types, opts);
  } // make them into Redux Types
  )(config);
};

// an action creator with additional properties
var createActionCreator = function createActionCreator(name, extraPropNames, options) {
  var _merge = merge(defaultOptions$1, options),
      prefix = _merge.prefix;
  // types are upcase and snakey


  var type = '' + prefix + camelToScreamingSnake(name);

  // do we need extra props for this?
  var noKeys = isNil(extraPropNames) || isEmpty(extraPropNames);

  // a type-only action creator
  if (noKeys) return function () {
    return { type: type };
  };

  // an action creator with type + properties
  // "properties" is defined as an array of prop names
  if (is(Array, extraPropNames)) {
    return function () {
      for (var _len = arguments.length, values = Array(_len), _key = 0; _key < _len; _key++) {
        values[_key] = arguments[_key];
      }

      var stringKeys = filter(function (n) {
        return is(String, n);
      }, extraPropNames);
      var objs = filter(function (n) {
        return is(Object, n);
      }, extraPropNames);
      var providedProps = mergeAll(objs);
      var extraProps = zipObj(stringKeys, values);
      return _extends({ type: type }, providedProps, extraProps);
    };
  }

  // an action creator with type + properties
  // "properties" is defined as an object of {prop name: default value}
  if (is(Object, extraPropNames)) {
    var defaultProps = extraPropNames;
    return function (valueObject) {
      var providedProps = pick(Object.keys(defaultProps), valueObject);
      return _extends({ type: type }, defaultProps, providedProps);
    };
  }

  throw new Error('action props must be a null/array/object/function');
};

// build Action Creators out of an objet
var convertToCreators = function convertToCreators(config, options) {
  return mapObjIndexed(function (num, key, value) {
    if (typeof value[key] === 'function') {
      // the user brought their own action creator
      return value[key];
    } else {
      // lets make an action creator for them!
      return createActionCreator(key, value[key], options);
    }
  })(config);
};

var ca = (function (config, options) {
  if (isNil(config)) {
    throw new Error('an object is required to setup types and creators');
  }
  if (isEmpty(config)) {
    throw new Error('empty objects are not supported');
  }

  return {
    Types: convertToTypes(config, options),
    Creators: convertToCreators(config, options)
  };
});

/**
 * Allows your reducers to be reset.
 *
 * @param {string} typeToReset - The action type to listen for.
 * @param {function} originalReducer - The reducer to wrap.
 */
function resettableReducer$1(typeToReset, originalReducer) {
  // a valid type is required
  if (!is(String, typeToReset) || typeToReset === '') {
    throw new Error('A valid reset type is required.');
  }

  // an original reducer is required
  if (typeof originalReducer !== 'function') {
    throw new Error('A reducer is required.');
  }
  // run it through first to get what the default state should be
  var resetState = originalReducer(undefined, {});

  // create our own reducer that wraps the original one and hijacks the reset
  function reducer() {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : resetState;
    var action = arguments[1];

    if (action && action.type === typeToReset) {
      return resetState;
    } else {
      return originalReducer(state, action);
    }
  }
  return reducer;
}

var rr = curry(resettableReducer$1);

var createReducer = cr;
var createTypes = createTypes$1;
var createActions = ca;
var resettableReducer = rr;

exports.createReducer = createReducer;
exports.createTypes = createTypes;
exports.createActions = createActions;
exports.resettableReducer = resettableReducer;
exports.Types = Types;
