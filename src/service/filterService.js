import {pipeline} from '@xenova/transformers';
import profanityLib from '@2toad/profanity';
import {readFileSync} from "fs"
import cld from "cld"
import LanguageDetect from "languagedetect"
import {filterStatements} from "./statementFilter.js";

const profanityList = readFileSync("src/data/profanity_list.txt").toString().toLowerCase()
const profanityWords = profanityList.split("\r\n")

const goodWordList = readFileSync("src/data/good_words_list.txt").toString().toLowerCase()
const goodWords = goodWordList.split("\r\n")

const forbidWordsList = readFileSync("src/data/forbidden_words.txt").toString().toLowerCase()
const forbidWords = forbidWordsList.split("\r\n")

const stopWordsList = readFileSync("src/data/stop_words.txt").toString().toLowerCase()
const stopWords = stopWordsList.split("\r\n")

// Setting Profanity checker to detect the words that include forbidden/profanity words.
// For example: "assessment" will be detected as a forbidden/profanity, because it has "ass" in it.
const options = new profanityLib.ProfanityOptions();
options.wholeWord = false;

const profanity = new profanityLib.Profanity(options)
profanity.addWords(profanityWords)
profanity.addWords(forbidWords)

// Set a second language detection
const lngDetector = new LanguageDetect();

// This method removes all the "unnecessary" words from the input
const filterStopWords = async (words) => {
    const newWords = []
    for (let i = 0; i < words.length; i++) {
        if (stopWords.includes(words[i]))
            continue
        newWords.push(words[i])
    }

    return newWords
}

const filterForbiddenWords = async (allWords) => {

    for (let i = 0; i < allWords.length; i++) {
        const word = allWords[i]

        // Step 1.5: check for "profanity" and remove any words that are in the list.
        if (profanity.exists(word)) {
            console.log("The forbidden word is --- " + word)
            throw Error("One of the written words is not allowed. Please try again")
        }
    }

    return allWords
}

const isEnglishLang = async (text) => {
    let isEnglish
    try {
        const result = await cld.detect(text)
        const language = result.languages[0].name
        // matin polla beauty gevaar Gefahr zabic matar
        isEnglish = language === "ENGLISH"
    } catch (er) {
        // If the first "language verification" fails because of not enough prompts,
        // verify the language with another tool
        const languages = lngDetector.detect(text)
        for (let i = 0; i < languages.length; i++) {
            if (languages[i][0] === "english") {
                // If the proximity of English is lower than 0.18,
                // then we assume that the language is not english
                isEnglish = languages[i][1] >= 0.18
            }
            // Note: the second verification is not perfect, so there is a chance that
            // the English language will have proximity lower than 0.18.
            // However, the chances of that are significantly low
        }
    }
    if (!isEnglish)
        throw Error("Only English language is allowed")
}

export const filter = async(text) => {
    // Verifying the language used
    await isEnglishLang(text)

    // Step -1: Verify that the text doesn't include forbidden statements
    await filterStatements(text.toLowerCase(), true)

    // Step 0: transform the sentence into an array of single words
    const words = text.toLowerCase().split(" ")

    // Doesn't work intended. Can fix it later if needed
    // const newWords = await filterStopWords(words)

    let filteredWords = await filterForbiddenWords(words)

    console.log("The words that went through: " + filteredWords)

    // Step 4: All the words that passed previous steps are sent to the Stable Diffusion
    return filteredWords.join(" ")
}
