import {v2 as cloudinary} from "cloudinary"
import fs from "fs" 


cloudinary.config({ 
  cloud_name: process.env.CLOUNDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
  
});

cosnt uploadOnCloudinary=async(localFilePath)=>{
    try{
        if(!localFilePath) return null;
//upload the file on cloundinary
const response=await cloudinary.uploader.upload(localFilePath,{
    resources_type:"auto"
})
// file has been uploaded
console.log("the file  has been uploaded successfully on cloudinary"
,response.url);
return response;
    }catch(error){
        fs.unlinkSync(localFilePath)// remove the locally saved temporary file 
        // as upload operation got failed
        return null;
    }
}
 

export {uploadOnCloudinary}



// the classic method without customizaation

// cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
//   { public_id: "olympic_flag" }, 
//   function(error, result) {console.log(result); });