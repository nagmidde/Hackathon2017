var request = require('request');

var delayedquotes = '';
exports.handler = (event, context, callback) => {
    // TODO implement
    callback(null, 'Hello from Lambda');

    
    request('https://globalquotes.xignite.com/v3/xGlobalQuotes.json/GetGlobalDelayedQuote?IdentifierType=Symbol&Identifier=TROW&_token=AE4A02E0271A4E77B78B314AEE9A132D', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body) // Print the google web page.
         
            delayedquotes = body;
        }
    });
};
