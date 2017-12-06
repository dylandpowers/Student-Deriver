'use strict';
const Alexa = require('alexa-sdk');

exports.handler = function(event, context) {
	const alexa = Alexa.handler(event, context);

	alexa.registerHandlers(handlers, startHandlers, problemHandlers);

	alexa.execute();
};

const states = {
	START: "_START",
	PROBLEM: "_PROBLEM"
};

/*
function buildResponse(sessionAttributes, speechletResponse) {
	return {
		"version": "1.0",
		sessionAttributes: sessionAttributes,
		response: speechletResponse
	};
}
*/

// Alexa speaks these messages to user during conversation

const WELCOME_MESSAGE = "Good morning! Time for a math problem! ";

const START_PROBLEM = "Alright, here we go. ";

const REPEAT_WELCOME = "Come on! You have to get out of bed at some point!";

const RIGHT_ANSWER = "Great job you mother <say-as interpret-as='expletive'>fucker</say-as>! You're well on the way to a wonderful day. ";

const WRONG_ANSWER = "Sorry, that's not quite right. Please try again. ";

// Generic handlers
const handlers = {

	"LaunchRequest" : function() 
	{
		this.handler.state = states.START;
		this.emitWithState("Start");
	},
 	"ProblemIntent" : function() 
 	{
 		this.handler.state = states.PROBLEM;
 		this.emitWithState("Problem");
 	},
 	"AMAZON.StopIntent" : function() 
 	{
 		this.response.speak("See you later!");
 		this.emit(":responseReady");
 	},
 	"AMAZON.CancelIntent" : function() 
 	{
 		this.response.speak("See you next time!");
 		this.emit(":responseReady");
 	},
 	"Unhandled": function() 
 	{
 		this.handler.state = states.START;
 		this.emitWithState("Start");
 	}
};

// Handlers once we have moved to state "start"
const startHandlers = Alexa.CreateStateHandler(states.START, {

	"Start": function() 
	{
		this.response.speak(WELCOME_MESSAGE).listen(REPEAT_WELCOME);
		this.emit(":responseReady");
	},
	"ProblemIntent": function() 
	{
		this.handler.state = states.PROBLEM;
		this.emitWithState("Problem");
	},
 	"AMAZON.StopIntent" : function() 
 	{
 		this.response.speak("See you later!");
 		this.emit(":responseReady");
 	},
 	"AMAZON.CancelIntent" : function() 
 	{
 		this.response.speak("See you next time!");
 		this.emit(":responseReady");
 	},
 	"Unhandled": function() 
 	{
 		this.emitWithState("Start");
 	}
});

// Handlers once we have moved into the problem portion
const problemHandlers = Alexa.CreateStateHandler(states.PROBLEM, {

	"Problem": function() 
	{
		this.attributes["response"] = START_PROBLEM;
		//this.attributes["exponent"] = 0;
		this.emitWithState("AskQuestion");
	},
	"AskQuestion" : function() 
	{
		this.attributes["exponent"] = getRandomIntStr(1, 10);
		this.attributes["coefficient"] = getRandomIntStr(1, 10);
		let question = "What is the derivative of " + this.attributes["coefficient"] + " <say-as interpret-as='characters'>x</say-as> to the power of " + this.attributes["exponent"] + "?";
		let speech = this.attributes["response"] + question;
		this.emit(":ask", speech, question);
	},
	"AnswerIntent" : function()
	{
		this.attributes["response"] = "";

		// Get the final answer (coefficient and exponent) from the user
		let answerCoeff = this.event.request.intent.slots.coeff.value;
		let answerExp = this.event.request.intent.slots.exp.value;

		// What Alexa should say back
		if (answerCoeff == (this.attributes["exponent"]*this.attributes["coefficient"]) && answerExp == (this.attributes["exponent"] - 1)) {
			this.attributes["response"] = RIGHT_ANSWER;
			this.response.speak(this.attributes["response"]);
			this.emit(":responseReady");
		} else {
			this.attributes["response"] = WRONG_ANSWER;
			//this.response.speak(this.attributes["response"]);
			this.emitWithState("AskQuestion");
		}
	},
	"AMAZON.StopIntent" : function()
	{
		this.response.speak("See you later!");
		this.emit(":responseReady");
	},
	"AMAZON.CancelIntent": function()
	{
		this.response.speak("See you tomorrow!");
		this.emit(":responseReady");
	},
	"Unhandled" : function() 
	{
		this.emitWithState("AnswerIntent");
	}
});

// Random integer calculation
function getRandomIntStr(min, max) {
	return (Math.floor(Math.random() * (max - min + 1)) + min).toString();
}

// Calculate the derivative, but only of a single term
// Parameter 'a' is power of x



