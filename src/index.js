import express from "express"
import cors from 'cors';
import {FilterRouter} from "./router/filterRouter.js"
import {config} from "dotenv"

config()

const app = express()
const port = process.env.PORT

app.use(cors())
app.use(express.json())

app.use("/filter", FilterRouter)

const main = async() => {
    app.listen(port)
}

main()
    .then(() => console.log("Server is running on port " + port))
    .catch((er) => {
        console.error(er)
        process.exit(1)
    })