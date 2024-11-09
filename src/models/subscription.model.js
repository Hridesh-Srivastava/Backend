import mongoose , { Schema } from "mongoose";

const subscriptionSchema = new Schema({
    //subscriber (User) who is subscribing
    subscriber : {
        type : Schema.Types.ObjectId,
        ref : "User"
    },
     //channel (User) on which subscriber is subscribing 
        channel : {
            type : Schema.Types.ObjectId,
            ref : "User"
        }
    },
        {
            timestamps : true
        }
);

export const subscription = mongoose.model("Subscription: " , subscriptionSchema);