// ==UserScript==
// @name                7logging
// @namespace           .
// @version             1.0
// @description         Logging every answer in the console and not create any html ui because of "unusual activites" flag
// @author              🥨 Modified from Gamray original 7sleeping
// @match               https://user.7speaking.com/*
// @icon                https://www.google.com/s2/favicons?sz=64&domain=7speaking.com
// @grant               none
// ==/UserScript==

(function () {
    'use strict';

    let isQuizzTOEIC = false
    let allQuizzTypes = ["fill", "grammar", "choice", "matching", "listening", "TOEIC"]

    function unifyString(str) {
        str = str.toString().toLowerCase()
        return str.trimEnd()
    }

    function getQuizzObject() {
        let question_div = isQuizzTOEIC ? document.querySelector(".question_variant") : document.querySelector(".question")
        if (question_div == undefined) {
            let test_div = document.querySelector(".ExamsAndTests__questionContainer")
            if (test_div == undefined) {
                console.log("[DEBUG] - No quiz found")
                return undefined
            }
            console.log("[DEBUG] - Found TOEIC test container")
            return undefined
        }

        let reactKey = Object.keys(question_div)[0]

        let curr_kc = question_div[reactKey]

        while (curr_kc.memoizedProps.answerOptions == undefined && curr_kc.memoizedProps.question == undefined) {
            curr_kc = curr_kc.return
            if (curr_kc == undefined) {
                console.log("[DEBUG] - Could not find quiz properties")
                return undefined
            }
        }
        return isQuizzTOEIC ? curr_kc.memoizedProps.question : curr_kc.memoizedProps
    }

    function getQuizzType(quizz) {
        let type = isQuizzTOEIC ? "TOEIC" : quizz.variant
        return type
    }

    function getCurrentAnswer(quizz) {
        let answer
        if (getQuizzType(quizz) == "listening") {
            answer = quizz.answerOptions.answer[0] - 1
        }
        else if (getQuizzType(quizz) == "matching") {
            answer = quizz.answerOptions.answer
        }
        else if (getQuizzType(quizz) == "TOEIC") {
            answer = quizz.errorMessage.split('(')[1].split(')')[0].charCodeAt(0) - 65
        }
        else {
            answer = unifyString(quizz.answerOptions.answer[0].value)
        }
        console.log("[DEBUG] - Current answer:", answer)
        return answer
    }

    function analyzeCurrentQuizz() {
        let quizzObject = getQuizzObject()
        if (quizzObject == undefined) {
            console.log("[DEBUG] - No valid quiz found")
            return
        }

        let quizzType = getQuizzType(quizzObject)
        if (!allQuizzTypes.includes(quizzType)) {
            console.log("[DEBUG] - Unknown quiz type:", quizzType)
            return
        }

        let answer = getCurrentAnswer(quizzObject)
    }

    // Main initialization
    setTimeout(async function() {
        while (true) {
            if (document.querySelector(".quiz__container") == undefined && document.querySelector(".question_variant") == undefined) {
                await new Promise(resolve => setTimeout(resolve, 1000))
                continue
            }

            isQuizzTOEIC = document.querySelector(".question_variant") != undefined
            if (isQuizzTOEIC) {
                console.log("[DEBUG] - TOEIC quiz detected")
            }

            analyzeCurrentQuizz()
            await new Promise(resolve => setTimeout(resolve, 2000))
        }
    }, 5000);
})();