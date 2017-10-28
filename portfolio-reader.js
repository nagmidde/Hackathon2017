var AWS = require("aws-sdk");
var fs = require('fs');
var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
var https = require('https');

AWS.config.update({
  region: "us-east-1",
  endpoint: "http://localhost:8000"
});


exports.handler = function(event, context) {
    //console.log(JSON.stringify(event, null, '  '));
    var tableName = "portfolio";
    var params = {
     ProjectionExpression: 'symbol, description, quantity, purchdate, purchprice',
     TableName: 'portfolio'
    };
    
    dynamodb.scan(params, function(err, data) {
      if (err) {
        console.log("Error", err);
      } else {
        var newBalance = 0.0;
          
        data.Items.forEach(function(element, index, array) {
          //console.log(element.symbol.S + " (" + element.description.S + ")");
            getDelayedQuotes(element.symbol.S).then((resp) => {
                //console.log(resp);
                var obj = JSON.parse(resp);
                //console.log(obj.Close);
                newBalance = newBalance + (obj.Close * element.quantity.N);
                //console.log('newBalance' + newBalance);
                //this.emit(':ask', obj.Message + '<say-as interpret-as="interjection">Oh boy</say-as><break time="1s"/> Anything else I can help you with?', 'Sorry, what was that?');
            });          
        });
      }
    });
};

var delayedquotes = '';
var getDelayedQuotes = function(symbol){
    //console.log('symbol', symbol);
    return new Promise((resolve, reject) => {
        https.get('https://globalquotes.xignite.com/v3/xGlobalQuotes.json/GetGlobalDelayedQuote?IdentifierType=Symbol&Identifier='+ symbol+'&_token=AE4A02E0271A4E77B78B314AEE9A132D', function(response){
        	response.setEncoding("utf8");
        	response.on("data", function(data){
        		resolve(data);
        	})
        });
    });
};

