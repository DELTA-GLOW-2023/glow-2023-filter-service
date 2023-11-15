# Glow Filter Service

## Introduction
This service is responsible for checking user prompts and filtering out (or detecting) forbidden words and statements which may generate inappropriate pictures if passed to the Stable Diffusion.

## How it works
There are two main parts of the project which have very similar purposes: filterService and noErrorFilterService. The filterService checks the received input and throws an error as soon as it detects that "something is wrong". On the other hand, the noErrorFilterService filters the input form all the forbidden words/statements and unnecessary words and returns it as a string.

Initially these services were designed to have only one difference: one throws an error the other one doesn't. However, due to the changes in the project the whole functionality of the services is different. The filterService shows the "updated" functionality whilst the noErrorFilterService preserved the original logic.  

Now let's get into a little more details:

### filterService
First of all, we verify that the language used for input is English (this is checked because our system is designed to detect only English words properly). There are two separate tools that check the language: one is used for short inputs and is less accurate, the other is used for longer inputs and is more accurate.

If the detected language is not English an error is thrown, in case it is English we move to the next step. We send the text to the statementFilter which is responsible for filtering forbidden statements. If such is found, an error is thrown.

After "statement-check" we put the input text to the lowercase and split it on single words. Then we go through each word to verify that they are safe. If at least one of the words is not safe we throw an error, but if all words pass the check, we join all the words back to a single string and send it back to the user.

### noErrorFilterService
Now this service is a little more complicated.

First three steps are the same as in the filterService: we verify that the language is English, we filter all the forbidden statements and then we turn the text to the lower case and split it on single words. Although, here, if the language is not English, instead of an error the user will just receive an empty string. And in case of statement filtering, if a forbidden statement is detected all the words that belong to this statement are removed and the rest of the words stay as is.

After that we filter out all the so-called "stop words". Those are the words that don't help anyhow a model understand the input. So, for better Stable Diffusion performance we decided to clear them out as well.

Then we filter the forbidden words from the lists we have. The words that stayed then go through a sentiment model one by one. If the output is a positive sentiment, then word goes to the correctWords array, which forms a list of words that will be allowed to pass the filter. If a sentiment model outputs a negative sentiment for the word, then the word will be added to the correctWords list **and** to the doubleCheckList, which will be checked again later.

After getting these two lists, we pass them to another function that will filter "good words". Basically, it will go through the doubleCheckList words, see if any of the words in the list belong to "Good words". If a word doesn't exist in "Good words" then it is removed from the correctWords list, if it exists in "Good words" we keep it in the correctWords list.

(The "good word check" is necessary because the model we are using may output a "negative" sentiment on a word which should actually be allowed. That's why we double-check these words and if they are actually allowed, then we keep them in the prompt).

Eventually, after all the bad and good word filtering is finished, the words that are left are joined in a string and sent back to the user.

### Data
In a "src/data" folder we have a bunch of lists with words or statements. Here we will explain what each of them is responsible for:

1. forbidden_statements.txt --- This file contains all the forbidden statements which must be filtered out.
2. forbidden_words.txt --- This file contains all the single words that are not allowed.
3. forbidden_words_nl.txt --- A list of forbidden words in Dutch. It didn't have enough words, so we decided to forbid usage of Dutch language as well.
4. good_words_list.txt --- A list of words which the used model seas as "Negative" but which are actually should be allowed.
5. profanity_list.txt --- A list of profanity terms, which is also forbidden.
6. stop_words.txt --- A list of stop words which we decided to remove from the user prompt for the better Stable Diffusion performance.

## Run project
1. Firstly, add an .env file to the root folder of the project and add a line `PORT=8080`.
2. Run the `npm install` command in the root folder in the terminal to install the packages.
3. Run the `npm run dev` command to run the projects.
4. Now to make use of the service, use the url "localhost:8080/filter" with the POST (HTTP method) and add a "prompt" value in the body which should be a string. This will invoke the filterService.
5. In order to access noErrorFilterService, uncomment the code in the "router/filterRouter" and use the following url "localhost:8080/filter/no-error" also with the POST method and the prompt value in the body.
6. Enjoy :)