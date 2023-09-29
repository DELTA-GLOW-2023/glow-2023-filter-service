import {pipeline} from '@xenova/transformers';
import profanityLib from '@2toad/profanity';
import {readFileSync} from "fs"
import cld from "cld"


const profanityList = readFileSync("src/data/profanity_list.txt").toString().toLowerCase()
const profanityWords = profanityList.split("\r\n")

const goodWordList = readFileSync("src/data/good_words_list.txt").toString()
const goodWords = goodWordList.split("\r\n")

const forbidWordsList = readFileSync("src/data/forbidden_words.txt").toString().toLowerCase()
const forbidWords = forbidWordsList.split("\r\n")

// Setting Profanity checker to detect the words that include smth words.
// For example: "assessment" will be detected as a "smth"
const options = new profanityLib.ProfanityOptions();
options.wholeWord = false;

const profanity = new profanityLib.Profanity(options)
profanity.addWords(profanityWords)
profanity.addWords(forbidWords)
// TODO: check "eighteen plus" prompt

// TODO: add to bad words: "cut", "execute", "hard", "hurt", "ill", "grave", "lose", "miss", "body",
//  "repel (?)", "adult (?) (like adult content)", "sick", "satisfy", "communist"
const filterForbiddenWords = async (allWords) => {

    // Allocate a pipeline for sentiment-analysis
    let pipe = await pipeline("text-classification",'Xenova/distilbert-base-uncased-finetuned-sst-2-english');

    // An array of words that should be checked through "good word list"
    // after being "rejected" by the model (model output was "NEGATIVE")
    let doubleCheckList = []

    for (let i = 0; i < allWords.length; i++) {
        const word = allWords[i]
        // TODO:
        //  Step 1: check the "forbidden words". If there are any, get rid of them.
        //  Try to do it by including the whole list to the 2Toad profanity object.
        //  If it doesn't work (or works improperly), then just filter words if they are a part of the list.

        // Step 1.5: check for "profanity" and remove any words that are in the list.
        if (profanity.exists(word)) {
            throw Error("One of the written words is not allowed. Please try again")
        }

        // Step 2: check the words with the model. If the word is "POSITIVE" it passes to step 4, if it is "NEGATIVE" it goes to step 3
        // The NEGATIVE words are added to the "doubleCheckList"

        const result = await pipe(word);

        if (result[0].label === "NEGATIVE") {
            doubleCheckList.push(word)
        }
    }

    return {allWords, doubleCheckList}
}

const filterGoodWords = async (doubleCheckList, allWords) => {
    // Step 3: check the "NEGATIVE" words with the "permitted words" (e.g. "sad", "disappointed").
    // If the received word is in the list, it goes to step 4. If it is not, get rid of it.
    doubleCheckList.forEach( word => {
        // If a word in the "doubleCheckList" doesn't exist in the "good_words_list"
        // then we consider it a "bad word" and remove from the "allWords".
        if (!goodWords.includes(word)) {
            throw Error("One of the written words is not allowed. Please try again")
        }
        // If the word is in the "good_words_list", then we keep it in the "allWords"
        // and don't do anything with it here
    })

    return allWords
}

const isEnglishLang = async (text) => {
    const result = await cld.detect(text)
    const language = result.languages[0].name
    // matin polla beauty gevaar Gefahr zabic matar
    if (language !== "ENGLISH")
        throw Error("Only English language is allowed")
}

export const filter = async(text) => {
    // Verifying the language used
    await isEnglishLang(text)

    // Step 0: transform the sentence into an array of single words
    let words = text.toLowerCase().split(" ")

    let {allWords, doubleCheckList} = await filterForbiddenWords(words)

    allWords = await filterGoodWords(doubleCheckList, allWords)


    console.log("The words that went through: " + allWords)
    console.log("The words to double check: " + doubleCheckList)


    // Step 4: All the words that passed previous steps are sent to the Stable Diffusion
    return allWords.join(" ")
}
