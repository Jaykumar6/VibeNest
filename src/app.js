import express from 'express'
import cookieparser from 'cookie-parser'
import cors from 'cors'
const app = express()


app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))
app.use(express.json({limit:'10mb'}))
app.use(express.urlencoded({extended:true,limit:'10mb'}))
app.use(express.static('public'))
app.use(cookieparser())

//routers
import userRouter from './routes/user.routes.js'



//router declaration
app.use('/api/v1/users',userRouter)




export {app} 