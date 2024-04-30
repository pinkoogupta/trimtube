// by using promises 

const asyncHandler=(requestHandler)=>{
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}






export {asyncHandler}





// how to pass the function callback in another function


// const asyncHandler=()=>{} /normal
// const asyncHandler=(func)=> ()=>{} //pass the function in another function 
// const asyncHandler=(func)=>{()=>{}} //{ } bracket means call back and and by removal of { } ,it remains also same 
// const asyncHandler=(func)=>async ()=>{} //if want to make it async 




// by using try catch


// const asyncHandler=(fn)=>async(req,res,next)=>{
//     try{
//         await fn(req,res,next)
//     }catch(error){
//         res.status(err.code||500).json({
//             success:false,
//             messege:err.messege
//         })
//     }
// }
