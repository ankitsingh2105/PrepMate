const userModel = require("../../Model/userModel");
const mockModel = require("../../Model/mockModel");
const { ObjectId } = require('mongoose').Types; // or 'mongodb' if not using Mongoose


async function handleUserInfo(req, response) {

    const { userName } = req.user;
    try {
        const userData = await userModel.findOne({ userName });
        const { email, name, _id, bookings, bio } = userData;
        response.status(200).send({ _id, userName, email, name, bookings, bio });
    }
    catch (error) {
        console.log("error :: ", error);
        response.status(404).send("Some Error Occured");
    }
}


const mongoose = require("mongoose");

async function handleAvailability(req, response) {
    const { timeSlot, mockType, userId } = req.body;
    const { date, time } = timeSlot;
    console.log("masaala is  :: ", timeSlot, mockType, userId)
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
            return response.send({
                message: "You cannot book two entries for the same time",
                code: 1
            });
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
            let idd = (conflictingBooking.user).valueOf();
            let otherUserTicketID = (conflictingBooking._id).valueOf()
            try {
                const newMockModel = new mockModel({
                    mockType,
                    schedule: checkSchedule,
                    tempLock: true,
                    user: userId
                });

                let bookingId = (newMockModel._id).valueOf();
                let sameUser = await userModel.findOneAndUpdate(
                    { _id: userId },
                    {
                        $push: { bookings: { myUserId: userId, otherUserId: idd, bookingTime: checkSchedule, mockType, myTicketId: bookingId, otherUserTicketID } }
                    }
                );
                let otherUser = await userModel.findOneAndUpdate(
                    { _id: idd },
                    {
                        $push: { bookings: { myUserId: idd, otherUserId: userId, bookingTime: checkSchedule, mockType, myTicketId: otherUserTicketID, otherUserTicketID: bookingId } }
                    }
                );

                await newMockModel.save();
                console.log("found the other user :: ", otherUser);
                console.log("found the other user :: ", sameUser);
                console.log("Matching booking found for another user, locking it temporarily.");
                return response.send({
                    message: "Your booking is confirmed, please check your profile",
                    code: 2
                });
            }
            catch (error) {
                console.log("found the other user error :: ", error);
                response.send(error)
            }
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
        secure: true,
        sameSite: "None",
    }).send();
}


async function handleUpdateUserInfo(req, response) {
    console.log("updating info");
    console.log(req.body);
    const { email, name, bio } = req.body;
    try {
        let newUser = await userModel.findOneAndUpdate({ userName }, {
            email,
            name,
            bio
        })
        console.log("new user :: ", newUser);
        response.send("User info updated");
    }
    catch (error) {

    }
}

async function handleCancelBooking(req, res) {
    const { myUserId, otherUserId, myTicketId, otherUserTicketID, mockType, bookingTime } = req.body;
    // todo :: go to both users and using ticket if remove the elemt of the booking array
    // * removing ticket entry from my side
    try {
        let response = await userModel.findOneAndUpdate({ _id: myUserId },
            {
                $pull: {
                    bookings: {
                        otherUserTicketID
                    }
                }
            },
            { new: true }
        )
    }
    catch (error) {
        console.log("first error ::  ", error);
    }
    // * removing ticket entry other my side
    try {
        let response = await userModel.findOneAndUpdate({ _id: otherUserId },
            {
                $pull: {
                    bookings: {
                        myTicketId: otherUserTicketID
                    }
                }
            },
            { new: true }
        )
    }
    catch (error) {
        console.log("second error ::  ", error);
    }
    // *remove the mock model from my side
    try {
        await mockModel.findOneAndDelete({ _id: myTicketId })
    }
    catch (error) {
        console.log("third :: ", error);
    }
    // *remove the mock model from the other side
    try {
        await mockModel.findOneAndDelete({ _id: otherUserTicketID })
    }
    catch (error) {
        console.log("fourth :: ", error);
    }
    res.send("Booking cancelled");
}

module.exports = {
    handleUserInfo,
    handleUserLogout,
    handleAvailability,
    handleUpdateUserInfo,
    handleCancelBooking
};
