import dotenv from 'dotenv'
import db from './db/index.js'
import { app } from './app.js'
dotenv.config({path:'./.env'})

db()
.then(()=> {
    app.listen(process.env.PORT || 3000, () => {
        console.log(`server is running on port ${process.env.PORT || 3000}`)
    })
}) 
.catch((error)=>{
    console.log(`MONGODB CONNECTION FAILED ${error}`)
})