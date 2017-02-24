// So to begin, we will grab all of the files ending with json in the tests folder
var isArray = function(a) { return (!!a) && (a.constructor === Array); };
var isObject = function(a) { return (!!a) && (a.constructor === Object); };
var isString = function(a) { return (!!a) && (a.constructor === String); };

var isNumber = function(a) {
  // check to see if it is a number or perhaps a string...
  if ( isNaN(a) )
  {
    return false;
  }else{
    return (a.constructor === Number) || (a.constructor === String);
  }
};


// Pass in a field from your IData file
var determineInterfaceType = function( type )
{
  switch (type.toLowerCase())
  {

    case "string":
      return "string";
      break;

    case "url":
    case "path":
      return "url";
      break;

    case "number":
      return "number";
      break;

    case "integer":
      return "integer";
      break;

    case "version":
    case "semver":
      return "version";
      break;

    case "bool":
    case "boolean":
    case "yesno":
    case "truefalse":
      return "boolean";
      break;

    default:
      return "unknown";
  }
};

// This will compare the expected type with the data
var checkType = function( item, expectedType )
{
  // firstly we check to ssee if the expectedType is anything other than a string
  if ( !isString(expectedType) )
  {
    if ( isArray(expectedType ) )
    {
      return {match:false, value:item, type:"string not array", feedback:"Type Mis-match. Expecting an array, not a string"};
    }
    if ( isObject(expectedType ) )
    {
      return {match:false, value:item, type:"string not object", feedback:"Type Mis-match. Expecting an object, not a string"};
    }
    if ( isNumber(expectedType ) ) expectedType = ""+expectedType;
  }
  //console.log("checkType:"+item +" type:"+expectedType +" typeof:"+ (typeof expectedType));
  var match = true;
  switch (expectedType.toLowerCase())
  {
    // also a string test
    case "url":
    case "path":
      match = isString(item);
      return {match:match, value:item, type:"url"};
      break;

    // check to see if this is a string (code also allowed)
    case "string":
      match = isString(item);
      return {match:match, value:item, type:"string"};
      break;

    // check to see if item is a number
    case "number":
      match = isNumber(item);
      return {match:match, value:parseFloat(item), type:"number"};
      break;

    case "integer":
      match = isNumber(item);
      var isWhole = parseInt(item) === parseFloat(item);
      return {match:match && isWhole, value:parseInt(item), type:"integer"};
      break;

    case "version":
    // check for [0-9].[0-9]
      return {match:match, value:true, type:"version", subtype:"version"};
      break;

    case "semver":
    // check for [0-9].[0-9].[0-9]
      return {match:match, value:true, type:"semver", subtype:"semver"};
      break;

    case true:
    case "true":
    case "yes":
      return {match:match, value:true, type:"boolean"};
      break;

    case "false":
    case false:
    case "no":
      return {match:match, value:false, type:"boolean"};
      break;

    case "boolean":
      return {match:match, value:!!item, type:"boolean"};
      break;

    default:
      return {match:false, value:item, type:"unknown type",feedback:"Could be a custom type, but is not in Interface"};
  }
};

module.exports = {

  isArray:isArray,
  isObject:isObject,
  isString:isString,
  isNumber:isNumber,
  determineInterfaceType:determineInterfaceType,
  checkType:checkType
}
