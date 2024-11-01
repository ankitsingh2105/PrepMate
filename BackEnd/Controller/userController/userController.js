const userModel = require("../../Model/userModel");
const mockModel = require("../../Model/mockModel");
const { ObjectId } = require('mongoose').Types; // or 'mongodb' if not using Mongoose


async function handleUserInfo(req, response) {

    const { userName } = req.user;
    try {
        const userData = await userModel.findOne({ userName });
        const { email, name, _id } = userData;
        response.status(200).send({ _id, userName, email, name });
    }
    catch (error) {
        console.log("error :: ", error);
        response.status(404).send("Some Error Occured");
    }
}


async function handleAvailability(req, response) {
    const { timeSlot, mockType, userId } = req.body;
    const { date, time } = timeSlot;
    console.log("In availability check ::: ", date, time, mockType, userId);

    const checkSchedule = date + time;

    try {
        // Check if the user has an existing or temporarily locked booking
        const existingBooking = await mockModel.find({});
        let filterArray = existingBooking.filter((e) => {
            console.log(e.user.toString(), " and ", userId);
            return e.user.toString() !== userId;
        });
        // filterArray = filterArray.filter((e) => {
        //     console.log(e.user.toString(), " and ", userId);
        //     return e.mockType != mockType;
        // });

        console.log("filtering :: ", filterArray);
        // i will now check for schedule time and mock type in this filterArray
        let isAvailable = null;

        for (let mock of filterArray) {
            if (mock.schedule === checkSchedule && mock.mockType === mockType) {
                isAvailable = mock;
                mock.isAvailable = false
                break;
            }
        }

        console.log("op ankot ", isAvailable);
        if (!isAvailable) {
            const newMockModel = new mockModel({
                mockType,
                schedule: checkSchedule,
                tempLock: false,
                isAvailable: true,
                user: userId
            });
            isAvailable = false;
            newMockModel.save();
            return response.send(
                isAvailable
            );
        }

        const newMockModel = new mockModel({
            mockType,
            schedule: checkSchedule,
            tempLock: false,
            isAvailable: false,
            user: userId 
        });
        newMockModel.save();
        isAvailable.isAvailable = false;
        response.send(isAvailable);

    } catch (error) {
        console.log("Error in handling availability:", error);
        response.status(500).send("Server error");
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
    handleUserLogout,
    handleAvailability
};
