/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills
 * nodejs skill development kit.
 * This sample supports multiple lauguages. (en-US, en-GB, de-DE).
 * The Intent Schema, Custom Slots and Sample Utterances for this skill, as well
 * as testing instructions are located at https://github.com/alexa/skill-sample-nodejs-fact
 **/

'use strict';
var AWS = require("aws-sdk");
const Alexa = require('alexa-sdk');
var https = require('https');
var fs = require('fs');
var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

//=========================================================================================================================================
//TODO: The items below this comment need your attention.
//=========================================================================================================================================

//Replace with your app ID (OPTIONAL).  You can find this value at the top of your skill's page on http://developer.amazon.com.
//Make sure to enclose your value in quotes, like this: const APP_ID = 'amzn1.ask.skill.bb4045e6-b3e8-4133-b650-72923c5980f1';
const APP_ID = "amzn1.ask.skill.e9e04c5d-8623-424b-8344-3b5ade0ebca0";

const SKILL_NAME = 'Jarvis';
const GET_FACT_MESSAGE = "Here's your fact: ";
const HELP_MESSAGE = 'You can say what is my portfolio balance?, or how will my portfolio do in the future?';
const HELP_REPROMPT = 'What can I help you with?';
const STOP_MESSAGE = 'Goodbye!';


exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

const handlers = {
    'LaunchRequest': function () {
        this.emit(':ask', "Welcome to your financial adviser bot, Jarvis. How can I help you?", "Can you say that again?");
    },
    'MyBalanceIntent': function () {
       getUserBalance().then((balance) => {
            this.emit(':ask', 'Your balance is ' + balance.toFixed(2) + ' dollars. Do you have any other questions?', 'Sorry, can you say that again?');
        });
    },
    'MyForecastIntent': function () {
       getUserForecast().then((forecast) => {
            this.emit(':ask', 'Your forecast is ' + forecast.TROW.recommendation + ". Anything else?", 'I did not get that, can you say it again?');
        });
    },
    'MyYesIntent': function () {
        this.emit(':ask', 'OK! What would you like to know?', 'Sorry, I did not understand. Can you repeat that?');
    },
    'MyNoIntent': function () {
        this.emit(':tell', '<say-as interpret-as="interjection">Alright, fine!</say-as><break time="1s"/>  have a nice day.');
    },
    'AMAZON.HelpIntent': function () {
        const speechOutput = HELP_MESSAGE;
        const reprompt = HELP_REPROMPT;

        this.response.speak(speechOutput).listen(reprompt);
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function () {
        this.response.speak(STOP_MESSAGE);
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
        this.response.speak(STOP_MESSAGE);
        this.emit(':responseReady');
    }
};

var getDelayedQuotes = function(symbol){
    return new Promise((resolve, reject) => {
        https.get('https://globalquotes.xignite.com/v3/xGlobalQuotes.json/GetGlobalDelayedQuote?IdentifierType=Symbol&_token=AE4A02E0271A4E77B78B314AEE9A132D&Identifier='+ symbol, function(response){
            response.setEncoding("utf8");
            response.on("data", function(data){
                resolve(data);
            }, function(err){
                console.log(err);
                reject(err);
            });
        });
    });
};

var getForecast = function(symbol){
    return new Promise((resolve, reject) => {
        https.get('https://factsetestimates.xignite.com/xFactSetEstimates.json/GetLatestRecommendationSummaries?IdentifierType=Symbol&UpdatedSince=&_token=AE4A02E0271A4E77B78B314AEE9A132D&Identifiers='+ symbol, function(response){
            response.setEncoding("utf8");
            response.on("data", function(data){
                resolve(data);
            })
        });
    });
};



AWS.config.update({
  region: "us-east-1",
  endpoint: "http://localhost:8000"
});


var getUserBalance = function() {
    return new Promise((resolve, reject) => {
        var tableName = "portfolio";
        var params = {
         ProjectionExpression: 'symbol, description, quantity, purchdate, purchprice',
         TableName: 'portfolio'
        };
        
        dynamodb.scan(params, function(err, data) {
          if (err) {
            reject(err);
          } 
          else{
                var newBalance = 0.0;
                var promises = [];
                data.Items.forEach(function(element, index, array) {
                    promises.push(getDelayedQuotes(element.symbol.S));
                });
                
                Promise.all(promises).then((balances) => {
                    data.Items.forEach(function(element, index, array) {
                        var obj = JSON.parse(balances[index]);
                        newBalance = newBalance + (obj.Close * element.quantity.N);
                    });
                    resolve(newBalance);
                });
          }
        });
    });
};


var getUserForecast = function() {
    return new Promise((resolve, reject) => {
        var tableName = "portfolio";
        var params = {
         ProjectionExpression: 'symbol, description, quantity, purchdate, purchprice',
         TableName: 'portfolio'
        };
        
        dynamodb.scan(params, function(err, data) {
          if (err) {
            reject(err);
          } 
          else {
            var forecast = {};
            var promises = [];
            data.Items.forEach(function(element, index, array) {
                promises.push(getForecast(element.symbol.S));
            });
            
            Promise.all(promises).then((resp) => {
                data.Items.forEach(function(element, index, array) {
                    var obj = JSON.parse(resp[index]);
                    forecast[element.symbol.S]= {};
                    forecast[element.symbol.S].targetPrice= obj[0].RecommendationSummarySet[0].TargetPrice;
                    forecast[element.symbol.S].recommendation= obj[0].RecommendationSummarySet[0].Recommendation;
                });
                resolve(forecast);
            });
          }
        });
    });
};
