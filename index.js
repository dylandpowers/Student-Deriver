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

const RIGHT_ANSWER = "Great job you star! You're well on the way to a wonderful day. ";

const WRONG_ANSWER = "Sorry, that's not quite right. Please try again. ";

const data = [
	{func: "sine", derivative: "cosine"},
	{func: "cosine", derivative: "negative sine"},
	{func: "natural logarithm", derivative: "one divided by"},
	// If we select this one, we will just generate a random coefficient and exponent
	{func: "x", derivative: "foo"}
];

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
		
		let index = getRandomInt(0, data.length-1);
		let item = data[index];
		var property = item["func"];
		this.attributes["func"] = property;
		if (property === "x") { // If we need an exponent and a coefficient generated
			this.emitWithState("AskEasyQuestion");
		} else {  

			// This is the case where we need a more complex derivative
			this.attributes["derivative"] = item["derivative"];
			this.emitWithState("AskHardQuestion"); 
		}
	},
	"AskEasyQuestion" : function() 
	{
		this.attributes["exponent"] = getRandomInt(1, 11).toString();
		this.attributes["coefficient"] = getRandomInt(1, 10).toString();
		let question = "What is the derivative of " + this.attributes["coefficient"] + " <say-as interpret-as='characters'>x</say-as> to the power of " + this.attributes["exponent"] + "?";
		let speech = this.attributes["response"] + question;
		this.emit(":ask", speech, question);
	},
	"AskHardQuestion" : function() 
	{
		let question = "What is the derivative of " + this.attributes["func"] + " of <say-as interpret-as='character'>x</say-as>?";
		let speech = this.attributes["response"] + question;
		this.emit(":ask", speech, question);
	},
	"AnswerIntent" : function()
	{
		this.attributes["response"] = "";

		// Case where we are dealing with a simple function
		if (this.attributes["func"] === "x") {
		// Get the final answer (coefficient and exponent) from the user
			let answerCoeff = this.event.request.intent.slots.coeff.value;
			let answerExp = this.event.request.intent.slots.exp.value;

			// What Alexa should say back based upon what the answer is
			if (answerCoeff == (this.attributes["exponent"]*this.attributes["coefficient"]) && answerExp == (this.attributes["exponent"] - 1)) {
				this.attributes["response"] = RIGHT_ANSWER;
				this.response.speak(this.attributes["response"]);
				this.emit(":responseReady");
			} else {
				this.attributes["response"] = WRONG_ANSWER;
				this.response.speak(this.attributes["response"]);
				this.emitWithState("AskEasyQuestion");
			}
		} else {
			// This is the case where we are dealing with more complex derivatives
			// Remember that we have stored this.attributes["derivative"]
			let answerFunc = this.event.request.intent.slots.function.value;

			// What Alexa should say back based upon what the answer is
			if (answerFunc == this.attributes["derivative"]) {
				this.attributes["response"] = RIGHT_ANSWER;
				this.response.speak(this.attributes["response"]);
				this.emit(":responseReady");
			} else {
				this.attributes["response"] = WRONG_ANSWER;
				this.response.speak(this.attributes["response"]);
				this.emitWithState("AskEasyQuestion");
			}

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
function getRandomInt(min, max) {
	return (Math.floor(Math.random() * (max - min + 1)) + min);
}
