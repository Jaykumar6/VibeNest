import mongoose,{Schema} from "mongoose"

const subscriptionSchema = new Schema({
    subscriber:{
        typeof:Schema.Types.ObjectId,
        ref:"User"
    }



}
,{timestamp:true})

export  const Subscription = mongoose.model("Subscription", subscriptionSchema)