import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${ process.env.MONGODB_URI }/${ DB_NAME }`); //no space '/' k aage peeche
            console.log(`MongoDB connected successfully! host: ${connectionInstance.connection.host}`);
  
        } catch (error) {
        console.error("Error while connecting to Database!" , error);
        process.exit(1); //1 default value says overloaded nodejs process failure
    }  
}

export default connectDB;