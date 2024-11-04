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
    const checkSchedule = date + " " + time;

    try {
        // 1: Check if the user already has a booking for the same schedule and mock type
        const existingBooking = await mockModel.findOne({
            user: userId,
            mockType: mockType,
            schedule: checkSchedule
        });

        if (existingBooking) {
            console.log("Booking already exists for this user, mock type, and schedule.");
            return response.send("You cannot book two entries for the same time");
        }

        // Step 2: Attempt to lock a conflicting booking for another user (atomic operation)
        const conflictingBooking = await mockModel.findOneAndUpdate(
            {
                mockType: mockType,
                schedule: checkSchedule,
                user: { $ne: userId },
                tempLock: false 
            },
            { $set: { tempLock: true } },  // * Atomically lock this booking (in instance)
            { new: true }  // * Return the updated document
        );

        if (conflictingBooking) {
            console.log("currentUser :: ", userId);
            console.log(conflictingBooking.user);
            let idd = conflictingBooking.user
            try {
                let otherUser = await userModel.findOneAndUpdate(
                    { _id: idd }, 
                    {
                        $push: { bookings: { userId, checkSchedule } }
                    }
                );
                let sameUser = await userModel.findOneAndUpdate(
                    { _id: userId }, 
                    {
                        $push: { bookings: { idd, checkSchedule } }
                    }
                );
                
                console.log("found the other user :: ", otherUser);
                console.log("found the other user :: ", sameUser);
            }
            catch (error) {
                console.log("found the other user error :: ", error);
            }
            console.log("Matching booking found for another user, locking it temporarily.");
            response.send("Your booking is confirmed, please check your profile");
            const newMockModel = new mockModel({
                mockType,
                schedule: checkSchedule,
                tempLock: true,
                user: userId
            });
            await newMockModel.save();
        }

        else {
            // Step 3: No conflict, create a new booking
            console.log("No conflicts, creating a new booking for the user.");
            const newMockModel = new mockModel({
                mockType,
                schedule: checkSchedule,
                tempLock: false,
                user: userId
            });
            await newMockModel.save();
            response.send("No one to schedule we are adding you for booking");
        }

    } 
    
    catch (error) {
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
