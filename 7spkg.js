// ==UserScript==
// @name                7speaking Auto-Answer
// @namespace           .
// @version             2.6
// @description         Automatically clicks on the correct answer, validates and goes to next question
// @author              Modified from Gamray original 7sleeping
// @match               https://user.7speaking.com/*
// @icon                https://www.google.com/s2/favicons?sz=64&domain=7speaking.com
// @grant               none
// ==/UserScript==

(function () {
    'use strict';

    let isQuizzTOEIC = false
    let allQuizzTypes = ["fill", "grammar", "choice", "matching", "listening", "TOEIC"]
    let lastAnsweredQuestion = null
    let isProcessing = false

    function unifyString(str) {
        str = str.toString().toLowerCase()
        return str.trimEnd()
    }

    function findReactProps(element) {
        for (let key in element) {
            if (key.startsWith('__reactFiber') || key.startsWith('__reactProps') || key.startsWith('__reactInternalInstance')) {
                return element[key];
            }
        }
        return null;
    }

    function getQuizzObject() {
        let question_div = isQuizzTOEIC ? document.querySelector(".question_variant") : document.querySelector(".question")
        if (question_div == undefined) {
            return undefined
        }

        let reactFiber = findReactProps(question_div)
        if (!reactFiber) {
            return undefined
        }

        let curr_kc = reactFiber
        let depth = 0
        const maxDepth = 50

        while (depth < maxDepth) {
            if (curr_kc.memoizedProps) {
                if (curr_kc.memoizedProps.answerOptions !== undefined || curr_kc.memoizedProps.question !== undefined) {
                    return isQuizzTOEIC ? curr_kc.memoizedProps.question : curr_kc.memoizedProps
                }
            }
            
            if (curr_kc.return) {
                curr_kc = curr_kc.return
                depth++
            } else {
                break
            }
        }
        
        return undefined
    }

    function getQuizzType(quizz) {
        return isQuizzTOEIC ? "TOEIC" : quizz.variant
    }

    function getCurrentAnswer(quizz) {
        let type = getQuizzType(quizz)
        
        try {
            if (type == "listening") {
                return quizz.answerOptions.answer[0] - 1
            }
            else if (type == "matching") {
                return quizz.answerOptions.answer
            }
            else if (type == "TOEIC") {
                if (quizz.errorMessage && quizz.errorMessage.includes('(')) {
                    return quizz.errorMessage.split('(')[1].split(')')[0].charCodeAt(0) - 65
                }
                return null
            }
            else {
                return unifyString(quizz.answerOptions.answer[0].value)
            }
        } catch (error) {
            return null
        }
    }

    function clickNext() {
        setTimeout(() => {
            let nextBtn = document.querySelector("button[type='submit'].question__btn")
            if (!nextBtn) {
                nextBtn = document.querySelector("button[type='submit']")
            }
            
            if (nextBtn && !nextBtn.disabled) {
                let btnText = nextBtn.textContent.trim()
                if (btnText.toLowerCase().includes('suivant') || btnText.toLowerCase().includes('next')) {
                    nextBtn.click()
                    console.log("[+] Clicked next button")
                }
            }
            
            setTimeout(() => {
                isProcessing = false
            }, 500)
        }, 500)
    }

    function validateAnswer() {
        setTimeout(() => {
            let submitBtn = document.querySelector("button[type='submit'].question__btn")
            if (!submitBtn) {
                submitBtn = document.querySelector("button[type='submit']")
            }
            
            if (submitBtn && !submitBtn.disabled) {
                let btnText = submitBtn.textContent.trim()
                if (btnText.toLowerCase().includes('valider') || btnText.toLowerCase().includes('validate') || btnText.toLowerCase().includes('submit')) {
                    submitBtn.click()
                    console.log("[+] Validated answer")
                    clickNext()
                } else {
                    isProcessing = false
                }
            } else if (submitBtn && submitBtn.disabled) {
                console.log("[ERROR] Submit button is disabled")
                isProcessing = false
            } else {
                console.log("[ERROR] Submit button not found")
                isProcessing = false
            }
        }, 500)
    }

    function clickOnAnswer(quizz, answer) {
        let type = getQuizzType(quizz)

        setTimeout(() => {
            try {
                if (type == "choice" || type == "listening") {
                    let buttons = document.querySelectorAll("button[type='button'][value]")
                    
                    if (typeof answer === 'number') {
                        for (let btn of buttons) {
                            if (parseInt(btn.getAttribute('value')) === answer) {
                                let btnText = btn.querySelector('.question__customLabel')?.textContent || btn.textContent.trim()
                                btn.click()
                                console.log(`[+] Answer: "${answer}", Found ${buttons.length} buttons, Clicked on "${btnText}"`)
                                validateAnswer()
                                return
                            }
                        }
                    } else if (typeof answer === 'string') {
                        for (let btn of buttons) {
                            let label = btn.querySelector('.question__customLabel')
                            if (label && unifyString(label.textContent) === answer) {
                                btn.click()
                                console.log(`[+] Answer: "${answer}", Found ${buttons.length} buttons, Clicked on "${label.textContent}"`)
                                validateAnswer()
                                return
                            }
                        }
                    }
                    
                    console.log(`[ERROR] Answer: "${answer}", Found ${buttons.length} buttons, No match found`)
                    isProcessing = false
                }
                else if (type == "fill" || type == "grammar") {
                    let inputs = document.querySelectorAll("input[type='text'], textarea, .MuiInputBase-input")
                    
                    if (inputs.length > 0) {
                        let input = inputs[0]
                        input.focus()
                        
                        let nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                        nativeInputValueSetter.call(input, answer);
                        
                        input.dispatchEvent(new Event('input', { bubbles: true }))
                        input.dispatchEvent(new Event('change', { bubbles: true }))
                        
                        console.log(`[+] Answer: "${answer}", Found ${inputs.length} inputs, Filled input`)
                        validateAnswer()
                    } else {
                        console.log(`[ERROR] Answer: "${answer}", No input found`)
                        isProcessing = false
                    }
                }
                else if (type == "TOEIC") {
                    let buttons = document.querySelectorAll("button[type='button'][value]")
                    
                    if (typeof answer === 'number') {
                        for (let btn of buttons) {
                            if (parseInt(btn.getAttribute('value')) === answer) {
                                let btnText = btn.querySelector('.question__customLabel')?.textContent || btn.textContent.trim()
                                btn.click()
                                console.log(`[+] Answer: "${answer}", Found ${buttons.length} buttons, Clicked on "${btnText}"`)
                                validateAnswer()
                                return
                            }
                        }
                    }
                    
                    console.log(`[ERROR] Answer: "${answer}", Found ${buttons.length} buttons, No match found`)
                    isProcessing = false
                }
            } catch (error) {
                console.log(`[ERROR] Exception: ${error.message}`)
                isProcessing = false
            }
        }, 500)
    }

    function analyzeCurrentQuizz() {
        if (isProcessing) return
        
        let quizzObject = getQuizzObject()
        if (!quizzObject) return

        let questionId = JSON.stringify(quizzObject)
        if (questionId === lastAnsweredQuestion) return

        let quizzType = getQuizzType(quizzObject)
        if (!allQuizzTypes.includes(quizzType)) return

        let answer = getCurrentAnswer(quizzObject)
        if (answer === null) return
        
        isProcessing = true
        lastAnsweredQuestion = questionId
        clickOnAnswer(quizzObject, answer)
    }

    setTimeout(async function() {
        console.log("[+] 7speaking script initialized")
        while (true) {
            if (document.querySelector(".quiz__container") == undefined && document.querySelector(".question_variant") == undefined) {
                await new Promise(resolve => setTimeout(resolve, 1000))
                continue
            }

            isQuizzTOEIC = document.querySelector(".question_variant") != undefined
            analyzeCurrentQuizz()
            await new Promise(resolve => setTimeout(resolve, 1000))
        }
    }, 3000);
})();
