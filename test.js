// This is a simple script that loads up an interface model of the
// required data types and makes sure that there are :
// - All neccessary keys
// - Correct data types in the fields
// - Valid syntax

// requires
var
  path 	= require('path'),
  fs 	  = require('fs'),
  chalk = require('chalk'),
  types = require('./test.types');

// shared variables
var
  globalLog = "Log _________________________\n";
  options = {
    verbose:false,
    showFails:true
  },
  textPassedTest = chalk.green("✓ PASS"),
  textFailedTest = chalk.red("✗ FAIL"),
  textPass = chalk.green("✓"),
  textFail = chalk.red("✗");

var saveLog = function( log, filename, callback )
{
  console.log( chalk.red("Saving log to "+filename) );
  fs.writeFile( filename,log, 'utf8', callback);
};

var createReference = function( IData, level )
{
  level = level || 0;
  var reference = {};
  var tabbing = level < 1 ? "" : level < 2 ? "\t" : level < 3 ? "\t\t" : "\t\t\t";
  var prefix = level === 0 ? chalk.magenta('Interface') : chalk.dim('->');

  // loop through Idata and determine types
  if (types.isArray(IData))
  {
    var branch = [];

    console.log( tabbing+prefix+""+data+' \t: array [' );
    for (var data in IData)
    {
      if (!IData.hasOwnProperty(data)) continue;
      console.log( tabbing+prefix+"BRANCH : "+IData[data]);
      if (types.isObject(IData[data]))
      {
        // array of objects
        branch.push( createReference(IData[data], level+1) );
      }else if (types.isArray(IData[data])){
        // array of arrays ;(
        // recurse!
        branch.push( createReference(IData[data], level+1) );
      }else{
        var arrayType = types.determineInterfaceType( IData[data] );
        console.log( tabbing+prefix+"BRANCH : "+IData[data] + "~" + arrayType );
        branch.push( arrayType );
      }
    }
    console.log( tabbing+prefix+""+data+'' );
    return branch;
  }

  // loop through Idata and determine types
  for (var data in IData)
  {
    if (!IData.hasOwnProperty(data)) continue;
    // check to see if it is an object or array.
    var content = IData[data];

    if (types.isArray(content))
    {
      var quantity = content.length;
      if (quantity === 0)
      {
        console.log( tabbing+prefix+"\t"+data+' \t: array [] '+chalk.red('EMPTY') );
      }else{
        console.log( tabbing+prefix+""+data+' \t: array [' );
        reference[data] = createReference(content, level+1);
        console.log( tabbing+']'+" : "+data );
      }
      continue;
    }

    if (types.isObject(content))
    {

      console.log( tabbing+prefix+""+data+' \t: object {' );
      //console.log( level+". isObject(content)\t"+content+' : '+isObject(content));
      reference[data] = createReference(content, level+1 );
      console.log( tabbing+""+data+' \t: }' );
      continue;
    }

    reference[data] = content;
    var type = types.determineInterfaceType( content );
    console.log( tabbing+prefix+ "\t"+data+' \t: '+type);
    // if it is an object we will have to recurse...
    reference[data] = type;
  }

  return reference;
};



var loadReference = function( IDataPath )
{
  //
  console.log( chalk.blue("Loading Interface file from ")+IDataPath);
  // fs.
  var IData = fs.readFileSync( IDataPath, 'utf-8');
  var reference = JSON.parse(IData);
  // check it has loaded and then parse
  return createReference(reference);
};


// Feed me a data object and I will compare both sets
// things that live in the interface wil define if the
// tests are successful or not
var checkJson = function( dataObject, IData, level )
{
  level = level || 0;
  var log = "", test, success = true;
  var tabbing = level < 1 ? "" : level < 2 ? "\t" : level < 3 ? "\t\t" : "\t\t\t";

  // loop through JSON file...

  // chheck if root node is an array or an object...
  if ( types.isArray(dataObject) )
  {
    for (var i=0, l=dataObject.length; i<l; ++i)
    {
      var item = dataObject[i];
      if (types.isArray(item) || types.isObject(item))
      {
        var isObject = types.isObject(item);
        if (item.length === 0)
        {
          console.log( tabbing+(!isObject ? "[]" : "{}"));
          log += (!isObject ? "[]" : "{}");
          continue;
        }
        //console.log( tabbing+ " field:'"+item+"");

        console.log( tabbing+(!isObject ? "[" : "{"));
        // we have an array inside this key element
        var childResult = checkJson( item, IData[0], level+1 );
        log += childResult.log;
        if (!childResult.success)
        {
          success = false;
        }
        console.log( tabbing+(!isObject ? "]" : "}"));
        continue;
      }

      // IData will now be a single item
      test = String(IData);
      if (!test)
      {
        console.log( tabbing+textFailedTest + " field:'"+item+ "does not exist on Interface"+textFail );
        success = false;
        log += "\n"+textFailedTest + " field:'"+data+ "does not exist on Interface"+textFail;
        continue;
      }

      // determine if the child data is an array or an object
      //console.log(i+".digging into field:'"+item +"' '"+(typeof test)+"'");
      var type = types.checkType( item, test );
      //console.log(i+".digging into field:'"+item +"' \t\ttype:'"+type.type+"' expected:'"+test+"'");
      if ( type.match )
      {
        console.log( tabbing+textPassedTest + " field:'"+item +"' \t\ttype:'"+type.type+"' expected:'"+test+"'");
      }else{
        // FAIL - TYPE MIS-MATCH!
        console.log( tabbing+textFailedTest + " field:'"+item +"' \t\ttype:'"+type.type+"' expected:'"+test+"'");
        log += "\n"+textFailedTest + " field:'"+item +"' \t\ttype:'"+type.type+"' expected:'"+test+"'"+textFail;

        success = false;
        continue;
      }
    }


  }else{

    // it most likely is an object!
    for (var data in dataObject)
    {
      if (!dataObject.hasOwnProperty(data)) continue;

      var passed = true;
      var comparator = dataObject[data];

      test = IData[data];

      if (types.isArray(comparator) || types.isObject(comparator))
      {
        // we have an array inside this key element
        var isObject = types.isObject(comparator);
        if (!comparator || comparator.length === 0)
        {
          console.log( tabbing+(!isObject ? data+"[]" : data+"{}"));
          log += "\n"+(!isObject ? "[]" : "{}");
          continue;
        }

        console.log( tabbing+(!isObject ? "[" : "{"));
        var childResult = checkJson( comparator, test, level+1 );
        log += "\n"+childResult.log;
        if (!childResult.success)
        {
          success = false;
        }
        console.log( tabbing+(!isObject ? "]" : "}"));
        continue;
      }

      // Fail
      if (!test)
      {
        console.log( tabbing+textFailedTest + " field:'"+data+ "does not exist on Interface"+textFail );
        log += "\n"+textFailedTest + " field:'"+data+ "does not exist on Interface"+textFail;
        success = false;
        continue;
      }

      // determine if the child data is an array or an object
      //console.log( tabbing+textFailedTest + " Comparing: "+comparator+ " with "+test );
      var type = types.checkType( comparator, test );
      if ( type.match )
      {
        //
        console.log( tabbing+textPassedTest + " field:'"+data +"' \t\ttype:'"+type.type+"' "+chalk.bold("expected:")+"'"+test+"'"+textPass);
      }else{
        // FAIL - TYPE MIS-MATCH!
        console.log( tabbing+textFailedTest + " field:'"+data +"' \t\ttype:'"+type.type+"' "+chalk.bold("expected:")+"'"+test+"'"+textFail);
        log += "\n"+textFailedTest + " field:'"+data +"' \t\ttype:'"+type.type+"' expected:'"+test+"'"+textFail;

        success = false;
        continue;
      }

    }
  }

  return { log:log, success:success };
}

//
var checkFileAgainstInterface = function( file, IData )
{
  // load file from fs
  var dataModel = fs.readFileSync( file, 'utf-8');
  dataModel = JSON.parse( dataModel );
  return checkJson( dataModel, IData );
}

var checkFile = function( file, IDataPath )
{
  var IData = loadReference( IDataPath );
  saveLog( JSON.stringify(IData) , 'test.log', function logSaved(){
    console.log( chalk.red("Saving log file : "+file) );
  });
  // we have a valid reference interface
  checkFileAgainstInterface( file, IData );
}

// Load interface, check folder for files, check file
var checkFolder = function( folder, IDataPath )
{
  // create reference from iData
  var IData = loadReference( IDataPath );
  var fileList = fs.readdirSync( folder );
  var log = "Results for "+folder;
  var results = [];
  // loop through list
  for (var file in fileList)
  {
    var path = fileList[ file ];
    console.log("Checking file : "+folder+"/"+path);
    var result = checkFileAgainstInterface( path, IData );
    log += result.log;
    results.push( result);
  }
  //saveLog( JSON.stringify(IData) , 'test.log', function logSaved(){
  saveLog( log , 'test.log', function logSaved(){
    console.log( chalk.red("Saving log file : "+log) );
  });

  return results;
};

// If run as :
// node test
console.log( chalk.bold("Project.json") );
console.log( chalk.bold("---------------------------") );
//checkFile( "./project.json", "Iproject.json" );

console.log("Checking files in tests/ folder");
checkFolder( "./tests", "Iproject.json" );

module.exports = {
  checkFile:checkFile,
  checkFolder:checkFolder
}
