var Promise = require("bluebird");
var request = require("request");
var colors = require("colors");

function Action(specObject) {
  this.specObject = specObject;
  this.baseRequest = this.parseDefaults();
  this.cookieJar = request.jar();
}

Action.prototype.list = function() {
  var data = this.specObject.action;
  var names = [];
  for (var key in data) {
    names[key] = data[key].name;
  }
  return names;
};

Action.prototype.parseAction = function(actionName) {
  var data = this.specObject.action;

  for (var key in data) {
    if (data[key].name === actionName) {
      return data[key];
    }
  }
};

Action.prototype.buildRequest = function(parsedAction) {
  var requestPromisified = Promise.promisify(request);
  var options = this.createOptionsObject(parsedAction);
  var extractedData = this.extractData(parsedAction);
  var self = this;
  var data;

  // console.log(options);

  return function(param) {
    if (param !== undefined) {
      var fullUri = options.uri + param;
      options.uri = fullUri;
    }
    // console.log(request(options));
    requestPromisified(options)
      .then(function(response) {
        // console.log(response.body);
        data = JSON.parse(response.body);
      })
      .then(function() {
        processedResponse = self.processResponse(data, extractedData);
        console.log(processedResponse.toString().yellow);
      })
      .catch(function(error) {
        throw error;
      });
  };
};

Action.prototype.createOptionsObject = function(parsedAction) {

  var options = {}

  if (parsedAction.options !== undefined) {
    return parsedAction.options
  }

  var excludedOptions = ['name', 'after', 'extract', 'pathParam']
  for (var key in parsedAction) {
    if (excludedOptions.indexOf(key) === -1) {
      options[key] = parsedAction[key];
    }
  }
  options.jar = this.cookieJar;

  return options;
};
Action.prototype.processArguments = function(string) {
  this.isArgument(parsedAction[key]) ? arguments[parsedAction[key][1]] : parsedAction[key];
};
Action.prototype.isArgument = function(string) {
  return string[0] === '<' && string[string.length - 1] === '>';
};

Action.prototype.parseDefaults = function() {


  // var defaultsObject = {};
  // if (this.specObject.defaults !== undefined) {
  //   defaultsObject = this.specObject.defaults;
  // }

  // defaultsObject.jar = true;
  // return request.defaults(defaultsObject);
};

Action.prototype.extractData = function(parsedAction) {
  var fieldsToExtract = parsedAction.extract;
  // console.log("fields to extract: ", fieldsToExtract);
  if (fieldsToExtract !== undefined) {
    return fieldsToExtract.map(function(value) {
      return value.split(".");
    });
  }
};

Action.prototype.processResponse = function(response, extractedData) {
  // console.log(extractedData);
  // console.log(typeof response);
  var result;

  function processObject(object, fieldsToExtract) {
    return fieldsToExtract.map(function(innerArray) {
      return innerArray.reduce(function(previous, current) {
        previous = previous[current];
        // console.log(previous);
        return previous;
      }, object);
    });
  }

  function processArray(array, fieldsToExtract){
    return array.map(function(innerObject){
      processObject(innerObject, fieldsToExtract);
    })
  }

  result = processObject(response, extractedData);



  return result;
};

module.exports = Action;
