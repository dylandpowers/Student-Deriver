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

const EXIT_MESSAGE = "Thanks for playing! I hope to see you again soon. ";

const HELP_MESSAGE = "You can ask me to quiz you, and I will ask you about common derivatives. ";

const data = [
    {func: "sine", derivative: ["cosine", "cos"]},
    {func: "cosine", derivative: ["negative sine", "minus sine", "negative sin", "minus sin"]},
    {func: "natural logarithm", derivative: ["1 over", "1 divided by"]},
    {func: "hyperbolic sine", derivative: ["cosh", "hyperbolic cosine"]},
    {func: "hyperbolic cosine", derivative: ["cinch", "hyperbolic sine"]},
    {func: "tangent", derivative: ["secant squared", "secant", "sec squared"]},
    {func: "cotangent", derivative: ["negative cosecant squared", "minus cosecant squared"]},
    // If we select this one, we will just generate a random coefficient and exponent
    {func: "x", derivative: "foo"}
];

// Speech cons supported by Alexa, for both wrong and correct answers
const speechConsCorrect = ["Booya", "Bam", "Bingo", "Bravo", "Cha Ching", 
"Hurrah", "Hurray", "Oh dear.  Just kidding.  Hurray", "Kaching",
"Righto", "Way to go", "Well done", "Woo hoo", "Yay", "Wowza"];

const speechConsWrong = ["Argh", "Aw man", "Bummer", "Darn", "D'oh", "Eek",
"Mamma mia", "Oh boy", "Oh dear", "Oof", "Shucks", "Uh oh", "Wah wah"];

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
        this.response.speak(EXIT_MESSAGE);
        this.emit(":responseReady");
    },
    "AMAZON.CancelIntent" : function() 
    {
        this.response.speak(EXIT_MESSAGE);
        this.emit(":responseReady");
    },
    "AMAZON.HelpIntent" : function()
    {
        this.response.speak(HELP_MESSAGE).listen(HELP_MESSAGE);
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
        this.response.speak(EXIT_MESSAGE);
        this.emit(":responseReady");
    },
    "AMAZON.CancelIntent" : function() 
    {
        this.response.speak(EXIT_MESSAGE);
        this.emit(":responseReady");
    },
    "AMAZON.HelpIntent" : function()
    {
        this.response.speak(HELP_MESSAGE).listen(HELP_MESSAGE);
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

        let question = "What is the <prosody rate='slow'>derivative</prosody> of " + this.attributes["derivative"]["coeff"] + " <say-as interpret-as='characters'>x</say-as> to the power of " + this.attributes["derivative"]["exp"] + "?";
        let speech = this.attributes["response"] + question;
        this.emit(":ask", speech, question);
    },
    "AskHardQuestion" : function() 
    {
       let question = "What is the <prosody rate='slow'>derivative</prosody> of " + this.attributes["func"] + " of <say-as interpret-as='characters'>x</say-as>?";
       let speech = this.attributes["response"] + question;
       this.emit(":ask", speech, question);
    },
    "EasyAnswerIntent" : function()
    {
        // Update this attribute in the answer just in case the user decides to stop the game before answering
        this.attributes["numQuestions"] += 1;

        // Get the final answer (coefficient and exponent) from the user
        let answerCoeff = this.event.request.intent.slots.coeff.value;
        let answerExp = this.event.request.intent.slots.exp.value;

        // What Alexa should say back based upon what the user spoke
        if (answerCoeff == (this.attributes["derivative"]["coeff"] * this.attributes["derivative"]["exp"]) && answerExp == (this.attributes["derivative"]["exp"] - 1)) {
            this.attributes["score"]++;
            this.attributes["response"] = getSpeechCon(true) + RIGHT_ANSWER + getScore(this.attributes["score"], this.attributes["numQuestions"]);
            this.emitWithState("Problem");
        } else {
            // Construct an array so that getIncorrectPhrase() returns the correct phrase. The "false" keyword indicates that this is an easy question.
            this.attributes["response"] = getSpeechCon(false) + getIncorrectPhrase(this.attributes["derivative"], this.attributes["func"]) + getScore(this.attributes["score"], this.attributes["numQuestions"]);
            this.emitWithState("Problem"); // We know that we will always go to this handler if our current function is 'x'
        }
        
    },
    "HardAnswerIntent": function() 
    {
        // Update this attribute in the answer just in case the user decides to stop the game before answering
        this.attributes["numQuestions"] += 1;

        // Remember that we have stored this.attributes["derivative"]
        let answerFunc = this.event.request.intent.slots.function.value;

        // What Alexa should say back based upon what the answer is
        if (checkAnswer(answerFunc, this.attributes["derivative"])) {
            this.attributes["score"]++;
            this.attributes["response"] = getSpeechCon(true) + RIGHT_ANSWER + getScore(this.attributes["score"], this.attributes["numQuestions"]);
            this.emitWithState("Problem");

        } else {
            this.attributes["response"] = getSpeechCon(false) + getIncorrectPhrase(this.attributes["derivative"], this.attributes["func"]) + getScore(this.attributes["score"], this.attributes["numQuestions"]);
            this.emitWithState("Problem");
        }
    },
    "AMAZON.StopIntent" : function()
    {
        this.response.speak(getFinalPhrase(this.attributes["score"], this.attributes["numQuestions"]));
        this.emit(":responseReady");
    },
    "AMAZON.CancelIntent": function()
    {
        this.response.speak(getFinalPhrase(this.attributes["score"], this.attributes["numQuestions"]));
        this.emit(":responseReady");
    },
    "AMAZON.HelpIntent" : function()
    {
        this.response.speak(HELP_MESSAGE).listen(HELP_MESSAGE);
        this.emit(":responseReady");
    },
    "Unhandled" : function() 
    {
        this.emitWithState("Problem");
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
    return "Your score is " + score + " out of " + numQuestions + ". Here is your next question.<break strength='strong'/> ";
}

// So that Alexa will say the correct answer if the user spoke the incorrect answer
function getIncorrectPhrase(derivative, func) {
    // If the function is simple
    if (func == "x") {
        return WRONG_ANSWER + "The correct answer is " + (derivative["coeff"]*derivative["exp"]) + " x to the power of " + (derivative["exp"] - 1) +  ". ";
    }
    return WRONG_ANSWER  + "The correct answer is " + derivative[0] + " x. ";
}

// Gets the final phrase that Alexa will say to the user when the user is done with the quiz
function getFinalPhrase(score, numQuestions) {
    return "Your final score is " + score + " out of " + numQuestions + ". " + EXIT_MESSAGE;
}

// Get a speech con with the corresponding SSML pause
// correct is a boolean indicating whether or not the response was correct.
function getSpeechCon(correct) {
    if (correct) return "<say-as interpret-as='interjection'> " + speechConsCorrect[getRandomInt(0, speechConsCorrect.length-1)] + "! </say-as><break strength='strong'/>";
    return "<say-as interpret-as='interjection'> " + speechConsWrong[getRandomInt(0, speechConsWrong.length-1)] + "! </say-as><break strength='strong'/>";
}
