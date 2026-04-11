import mongoose from 'mongoose'
import { DB_NAME } from '../constants.js'

const connectDB = async () => {
    try {
        const connections = await mongoose.connect(process.env.MONGO_URI, {
            dbName: DB_NAME,
        })
        console.log(`MongoDB is connected !! DB HOST:${connections.connection.host}`)
    } catch (error) {
        console.log('Error while connecting to database ',error)
        process.exit(1)
    }
}

export default connectDB 
