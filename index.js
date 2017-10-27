var request = require('request');

exports.handler = (event, context, callback) => {
    // TODO implement
    callback(null, 'Hello from Lambda');
    
    request('http://www.google.com', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body) // Print the google web page.
         }
    });
};
