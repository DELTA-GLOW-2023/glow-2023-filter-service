import {Router} from"express"
import validator from "express-validator"
import {filter} from"../service/filterService.js"
import {noErrorFilter} from "../service/noErrorFilterService.js";

const router = Router()

router.post("/", async(req, res) => {
    // TODO Add validation here if needed

    const { prompt } = req.body
    console.log("This is the prompt I receive: " + prompt)

    try {
        const finalPrompt = await filter(prompt)
        console.log("Here are the last words: " + finalPrompt)
        return res.json({prompt: finalPrompt})
    } catch (er) {
        console.error(er)
        return res
            // TODO consider making the status dynamic from the "er" object
            //  if it takes too much time, leave the Bad Request status
            .status(400)
            .json({ message: er.message})
    }
})

router.post("/no-error", async(req, res) => {
    // TODO Add validation here if needed

    const { prompt } = req.body

    try {
        const finalPrompt = await noErrorFilter(prompt)
        return res.json({prompt: finalPrompt})
    } catch (er) {
        console.error(er)
        return res
            // TODO consider making the status dynamic from the "er" object
            //  if it takes too much time, leave the Bad Request status
            .status(500)
            .json({ message: "Something went wrong"})
    }
})

router.get("/", (req, res) => {
    return res.json("The sentence")
})

export const FilterRouter = router