import mongoose,{Schema} from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const commentSchema = new Schema({
    content:{
        type:String,
        required:true
    },
    vidio:{
        type:Schema.Types.ObjectId,
        ref:"Vidio"
    },
    user:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },

},
{timestamps:true})

commentSchema.plugin(mongooseAggregatePaginate)

export const comment = mongoose.model("comment", commentSchema)