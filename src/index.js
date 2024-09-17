import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: "./.env",
});

app.on("error" , (error) => {
    console.error("error while fatching!" , error);
    throw error;
});

connectDB()
.then(() => {
    app.listen(process.env.PORT || 5000 , () => { //5000 our default port
        console.log(`listening on port ${process.env.PORT}`);
        
    });
})
.catch((error) => {
    console.error(`MongoDB connection failure` , error); 
});