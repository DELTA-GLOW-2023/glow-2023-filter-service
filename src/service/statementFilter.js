import {Profanity, ProfanityOptions} from '@2toad/profanity';
import {readFileSync} from "fs";

const forbidStatementsList = readFileSync("src/data/forbidden_statements.txt").toString().toLowerCase()
const forbidStatements = forbidStatementsList.split("\r\n")

const makeMap = (statements) => {
    const forbidMap = new Map()
    for (let i = 0; i < statements.length; i++) {
        const stateArr = statements[i].split(" ")
        forbidMap.set(stateArr[0],  stateArr)
    }
    return forbidMap
}

const forbidMap = makeMap(forbidStatements)

const profanityOpt = new ProfanityOptions()
profanityOpt.wholeWord = false

const profanity = new Profanity(profanityOpt)

// Generates an array that will be excluded from the profanity list,
// in order to avoid detection of "dwight" when was looking for "d"
// (e.g. from the forbidden statement "day d")
const lettersToExclude = async () => {
    const lettersArr = []
    for (const arr of forbidMap.values()) {
        arr.forEach(word => {
            if (word.length === 1)
                lettersArr.push(word)
        })
    }

    return lettersArr
}

export const filterStatements = async (text, throwError) => {
    let newTextArr = text.split(" ")
    const lettersArr = await lettersToExclude()
    // const forbidMap = await makeMap(forbidStatements)
    for (const key of forbidMap.keys()) {
        if (text.includes(key)) {
            let allWordsPresent = true
            // Firstly, check if all words/letters from the "forbidden statement"
            // are present.
            for (const word of forbidMap.get(key)) {
                if (!text.includes(word) || (word.length === 1 && !newTextArr.includes(word))) {
                    allWordsPresent = false
                    break
                }
            }
            // Secondly, if all words/letters are present, then we remove every word
            // where any part of the "forbidden statement" is mentioned
            if (allWordsPresent) {
                if (throwError)
                    throw Error("Inappropriate statement found")
                const textCloneArr = [...newTextArr]
                profanity.addWords(forbidMap.get(key))
                profanity.removeWords(lettersArr)
                textCloneArr.forEach(word => {
                    if (profanity.exists(word) || (word.length === 1 && forbidMap.get(key).includes(word))) {
                        newTextArr.splice(newTextArr.indexOf(word), 1)
                    }
                })
                text = newTextArr.join(" ")
            }
        }
    }
    return newTextArr.join(" ")
}