const userModel = require("../../Model/userModel");
const mockModel = require("../../Model/mockModel");
const { ObjectId } = require('mongoose').Types; // or 'mongodb' if not using Mongoose
const mongoose = require("mongoose");


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


async function handleAvailability(req, res) {
    const { timeSlot, mockType, userId } = req.body;
    const { date, time } = timeSlot;
    const checkSchedule = date + " " + time;

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // 1: Check existing booking (with session)
        const existingBooking = await mockModel.findOne({
            user: userId,
            mockType,
            schedule: checkSchedule
        }).session(session);

        if (existingBooking) {
            await session.abortTransaction();
            session.endSession();
            return res.send({ message: "You cannot book two entries for the same time", code: 1 });
        }

        // 2: Lock conflicting booking atomically (with session)
        const conflictingBooking = await mockModel.findOneAndUpdate(
            {
                mockType,
                schedule: checkSchedule,
                user: { $ne: userId },
                tempLock: false
            },
            { $set: { tempLock: true } },
            { new: true, session }
        );

        if (conflictingBooking) {
            const idd = conflictingBooking.user.valueOf();
            const otherUserTicketID = conflictingBooking._id.valueOf();

            const newMockModel = new mockModel({
                mockType,
                schedule: checkSchedule,
                tempLock: true,
                user: userId
            });

            const bookingId = newMockModel._id.valueOf();

            // Update both users with booking info (with session)
            await userModel.findOneAndUpdate(
                { _id: userId },
                {
                    $push: { bookings: { myUserId: userId, otherUserId: idd, bookingTime: checkSchedule, mockType, myTicketId: bookingId, otherUserTicketID } }
                },
                { session }
            );

            await userModel.findOneAndUpdate(
                { _id: idd },
                {
                    $push: { bookings: { myUserId: idd, otherUserId: userId, bookingTime: checkSchedule, mockType, myTicketId: otherUserTicketID, otherUserTicketID: bookingId } }
                },
                { session }
            );

            await newMockModel.save({ session });

            await session.commitTransaction();
            session.endSession();

            return res.send({
                message: "Your booking is confirmed, please check your profile",
                code: 2
            });
        } else {
            // 3: No conflict - create new booking
            const newMockModel = new mockModel({
                mockType,
                schedule: checkSchedule,
                tempLock: false,
                user: userId
            });

            await newMockModel.save({ session });

            await session.commitTransaction();
            session.endSession();

            return res.send({
                message: "No one to schedule, we are adding you for booking",
                code: 3
            });
        }
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error in handling availability:", error);
        return res.status(500).send("Server error");
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

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Remove booking entry from myUser
        await userModel.findOneAndUpdate(
            { _id: myUserId },
            { $pull: { bookings: { otherUserTicketID } } },
            { new: true, session }
        );

        // Remove booking entry from otherUser
        await userModel.findOneAndUpdate(
            { _id: otherUserId },
            { $pull: { bookings: { myTicketId: otherUserTicketID } } },
            { new: true, session }
        );

        // Remove mock booking from myUser side
        await mockModel.findOneAndDelete({ _id: myTicketId }, { session });

        // Remove mock booking from otherUser side
        await mockModel.findOneAndDelete({ _id: otherUserTicketID }, { session });

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        res.send("Booking cancelled successfully");
    } catch (error) {
        // Abort transaction if error occurs
        await session.abortTransaction();
        session.endSession();

        console.error("Error cancelling booking:", error);
        res.status(500).send("Failed to cancel booking");
    }
}


module.exports = {
    handleUserInfo,
    handleUserLogout,
    handleAvailability,
    handleUpdateUserInfo,
    handleCancelBooking
};
