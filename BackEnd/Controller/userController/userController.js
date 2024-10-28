const userModel = require("../../Model/userModel")
const { ObjectId } = require('mongoose').Types; // or 'mongodb' if not using Mongoose
async function handleUserInfo(req, response) {

    const { userName } = req.user;
    console.log("req user is :: ", req.user);
    console.log("userId is  :: ", userName);
    // console.log("userId in user Controller :: " , userId);
    try {
        const userData = await userModel.findOne({ userName });
        console.log(userData);
        const { email, name } = userData;
        response.status(200).send({ userName, email, name });
    }
    catch (error) {
        console.log("error :: ", error);
        response.status(404).send("Some Error Occured");
    }
} 
  

function handleUserLogout(req, response) {
    console.log("logging out");
    response.clearCookie("token", {
        httpOnly: true,
        secure: false,
    }).send();
}


module.exports = {
    handleUserInfo,
    handleUserLogout
};
