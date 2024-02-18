import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";

// const app = express()

const port = process.env.PORT || 8000;

dotenv.config({
    path: "./env",
});

connectDB()
.then(()=>{
    app.listen(port, () => {
        console.log(`Server is running at port: ${port}`);
    })

    app.on('error', (error) => {
        console.log("ERROR: ", error);
        throw error
    })
})
.catch((e) => {
    console.log("Mongo connection failed !! ", e);
})
