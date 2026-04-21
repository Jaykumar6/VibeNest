import dotenv from "dotenv"
import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

dotenv.config({ path: './.env' })

cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });

const uploadToCloudinary = async (filePath) => {
    try{ 
        if(!filePath) return null
        const response = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto",
        })
        //console.log("File is uploaded to Cloudinary",response.url)
        fs.unlinkSync(filePath)
        return response
    } catch(error){
       fs.unlinkSync(filePath)
       console.error("Error uploading file to Cloudinary",error)
       return null
     }
    }

const deleteFromCloudinary = async (publicId, resourceType = "image") => {
    if (!publicId) return null

    try {
        return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
    } catch (error) {
        console.error("Error deleting file from Cloudinary", error)
        return null
    }
}

const uploadOnCloudinary = uploadToCloudinary
    
    export{uploadToCloudinary, uploadOnCloudinary, deleteFromCloudinary}