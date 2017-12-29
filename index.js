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

// Alexa speaks these messages to user during conversation

const WELCOME_MESSAGE = "Hello, Homo Sapien. Time for a math <prosody pitch='high'>problem!</prosody> You can ask me for a problem or for a quiz. ";

const START_PROBLEM = "Alright, here we go. ";

const REPEAT_WELCOME = "If you would like a math problem, ask me for a problem. ";

const RIGHT_ANSWER = "That's <prosody pitch='high'>correct!</prosody> ";

const WRONG_ANSWER = "Sorry, that's not quite right. ";

const data = [
    {func: "sine", derivative: ["cosine", "cos"]},
    {func: "cosine", derivative: ["negative sine", "minus sine", "negative sin", "minus sin"]},
    {func: "natural logarithm", derivative: ["1 over", "1 divided by"]},
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
        this.attributes["response"] = START_PROBLEM;
        this.attributes["func"] = null;
        this.attributes["score"] = 0;
        this.attributes["numQuestions"] = 0;
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
        this.attributes["response"] = START_PROBLEM;
        this.attributes["func"] = null;
        this.attributes["score"] = 0;
        this.attributes["numQuestions"] = 0;
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

        this.attributes["numQuestions"] += 1;
        let questionArray = getNextQuestionFunc(this.attributes["func"]);
        this.attributes["func"] = questionArray[0]; // This will always hold the function
        this.attributes["derivative"] = questionArray[1]; // This will always hold the derivative

        if (this.attributes["func"] == "x") { // If we need an exponent and a coefficient generated
            this.emitWithState("AskEasyQuestion");
        } else { 
            // This is the case where we need a more complex derivative
            this.emitWithState("AskHardQuestion"); 
        }
    },
    "AskEasyQuestion" : function() 
    {
        // Generate a random coefficient and exponent, and store them in this.attributes["derivative"]
        let exponent = getRandomInt(1, 11).toString();
        let coefficient = getRandomInt(1, 10).toString();
        this.attributes["derivative"] = {exp: exponent, coeff: coefficient};

        let question = "What is the derivative of " + this.attributes["derivative"]["coeff"] + " <say-as interpret-as='characters'>x</say-as> to the power of " + this.attributes["derivative"]["exp"] + "?";
        let speech = this.attributes["response"] + question;
        this.emit(":ask", speech, question);
    },
    "AskHardQuestion" : function() 
    {
       let question = "What is the derivative of " + this.attributes["func"] + " of <say-as interpret-as='characters'>x</say-as>?";
       let speech = this.attributes["response"] + question;
       this.emit(":ask", speech, question);
    },
    "EasyAnswerIntent" : function()
    {
        // Get the final answer (coefficient and exponent) from the user
        let answerCoeff = this.event.request.intent.slots.coeff.value;
        let answerExp = this.event.request.intent.slots.exp.value;

        // What Alexa should say back based upon what the user spoke
        if (answerCoeff == (this.attributes["derivative"]["coeff"] * this.attributes["derivative"]["exp"]) && answerExp == (this.attributes["derivative"]["exp"] - 1)) {
            this.attributes["score"]++;
            this.attributes["response"] = RIGHT_ANSWER + getScore(this.attributes["score"], this.attributes["numQuestions"]);
            this.emitWithState("Problem");
        } else {
            // Construct an array so that getIncorrectPhrase() returns the correct phrase. The "false" keyword indicates that this is an easy question.
            this.attributes["response"] = getIncorrectPhrase(this.attributes["derivative"], this.attributes["func"]) + getScore(this.attributes["score"], this.attributes["numQuestions"]);
            this.emitWithState("Problem"); // We know that we will always go to this handler if our current function is 'x'
        }
        
    },
    "HardAnswerIntent": function() 
    {
        // Remember that we have stored this.attributes["derivative"]
        let answerFunc = this.event.request.intent.slots.function.value;

        // What Alexa should say back based upon what the answer is
        if (checkAnswer(answerFunc, this.attributes["derivative"])) {
            this.attributes["score"]++;
            this.attributes["response"] = RIGHT_ANSWER + getScore(this.attributes["score"], this.attributes["numQuestions"]);
            this.emitWithState("Problem");

        } else {
            this.attributes["response"] = getIncorrectPhrase(this.attributes["derivative"], this.attributes["func"]) + getScore(this.attributes["score"], this.attributes["numQuestions"]);
            this.emitWithState("Problem");
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

// Returns a string array, where the first item is the function and the second item is the derivative
function getNextQuestionFunc(oldFunc) {
    var newFunc = oldFunc;
    let newDerivative = null;

    // The below code ensures that we get a new function (different from the previous) every time
    while (newFunc == oldFunc) {
        let index = getRandomInt(0, data.length - 1);
        let item = data[index];
        newFunc = item["func"];
        newDerivative = item["derivative"];
    }

    return [newFunc, newDerivative];
}

// Checks the correctness of an answer
function checkAnswer(answerFunc, derivatives) {
    for (let i = 0; i < derivatives.length; i++) {
        if (answerFunc == derivatives[i]) return true;
    }
    return false;
}

function getScore(score, numQuestions) {
    return "Your score is " + score + " out of " + numQuestions + ". Here is your next question. ";
}

// So that Alexa will say the correct answer if the user spoke the incorrect answer
function getIncorrectPhrase(derivative, func) {
    // If the function is simple
    if (func == "x") {
        return WRONG_ANSWER + "The correct answer is " + (derivative["coeff"]*derivative["exp"]) + " x to the power of " + (derivative["exp"] - 1) +  ". ";
    }
    return WRONG_ANSWER  + "The correct answer is " + derivative[0] + " x. ";
}
