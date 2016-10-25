var builder = require('botbuilder');
var restify = require('restify');
var weatherClient = require('./wunderground');
var http = require('http');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    var myAppId = process.env.MY_APP_ID || "Missing your app ID";
    var myAppSecret = process.env.MY_APP_SECRET || "Missing your app secret";

});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

// You can provide your own model by specifing the 'LUIS_MODEL_URL' environment variable
// This Url can be obtained by uploading or creating your model from the LUIS portal: https://www.luis.ai/
const LuisModelUrl = process.env.LUIS_MODEL_URL || 'https://api.projectoxford.ai/luis/v1/application?id=c413b2ef-382c-45bd-8ff0-f76d60e2a821&subscription-key=3fa570ae50234017b9632b3b7180df43&q=';

// Create LUIS recognizer that points at our model and add it as the root '/' dialog for our Cortana Bot.
//var model = '
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var dialog = new builder.IntentDialog({ recognizers: [recognizer] });
var intents = new builder.IntentDialog();
bot.dialog('/', [
    function (session, args, next) {
        
        if (!session.userData.name) {
            session.beginDialog('/profile');
        	
        } else {
            next();
        }
    },
    function (session, results) {
        session.send('Hello %s!', session.userData.name);
    	session.send('My name is Mr. Weather-man');
    	session.send('I am a weather bot and I can fetch you weather details of any place around the world...');
    	session.beginDialog('/weather');
    }
]);

bot.dialog('/profile', [
    function (session) {
    	builder.Prompts.text(session, 'Hi! What is your name?');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]);

bot.dialog('/weather', dialog, intents);
dialog.matches('builtin.intent.weather.check_weather', [
    (session, args, next) => {
        var locationEntity = builder.EntityRecognizer.findEntity(args.entities, 'builtin.weather.absolute_location');
        if (locationEntity) {
            return next({ response: locationEntity.entity });
        } else {
            builder.Prompts.text(session, 'What location?');
        }
    },
    (session, results) => {
        weatherClient.getCurrentWeather(results.response, (responseString) => {
            session.send(responseString);
        	//session.endDialog();
        	session.send("Type in the next location??");
       //intents.matches(/^end/i, [  
    //function (session) {
        //session.endDialog();} ]);

       /* if (session.userData.name) {
            session.beginDialog('/NextIteration');
            session.send("Enter yes to continue and no to dis-continue");
        	
        }*/
        });
    },
     /*(session, args, next) =>{
        session.send("NextIteration");
        if (!session.userData.name) {
            session.beginDialog('/NextIteration');
        	
        }}*/
]);

/*bot.dialog('/NextIteration', intents);
//builder.Prompts.text("Would you like to search for another location ??");
intents.matches(/^yes/i, [
    function (session) {
        builder.Prompts.text(session, "Tell me the next location please..");
    	session.beginDialog('/weather');
    }]),
    intents.matches(/^no/i, [
    function (session) {
        builder.Prompts.text(session, "Thank You.");
    }
]);*/

dialog.onDefault(builder.DialogAction.send("Sorry but I couldn't understand you."));
