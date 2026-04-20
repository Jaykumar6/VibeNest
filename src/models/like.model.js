import mongoos ,{Schema} from "mongoose"

const likeSchema = new Schema({

    likeBy:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    vidio:{
        type:Schema.Types.ObjectId,
        ref:"Vidio"
    },
    comment:{
        type:Schema.Types.ObjectId,
        ref:"comment"
    },
    tweet:{
        type:Schema.Types.ObjectId,
        ref:"Tweet"
    }


},{timestamps:true})

export const Like = mongoose.model("like", likeSchema)