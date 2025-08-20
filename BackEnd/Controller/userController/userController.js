const userModel = require("../../Model/userModel");
const mockModel = require("../../Model/mockModel");
const { ObjectId } = require('mongoose').Types; // or 'mongodb' if not using Mongoose
const mongoose = require("mongoose");


function generateRandomString() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }
    return result;
}

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

        // 1️⃣ Prevent duplicate booking for same slot/user
        const existingBooking = await mockModel.findOne({
            user: userId,
            mockType,
            schedule: new Date(checkSchedule)
        }).session(session);

        if (existingBooking) {
            await session.abortTransaction();
            session.endSession();
            return res.send({ message: "You cannot book two entries for the same time", code: 1 });
        }

        // 2️⃣ Insert myself as a "waiting" booking first
        const myBooking = new mockModel({
            mockType,
            schedule: new Date(checkSchedule),
            tempLock: false,
            user: userId
        });
        await myBooking.save({ session });

        // 3️⃣ Try to atomically grab a partner
        const partner = await mockModel.findOneAndUpdate(
            {
                mockType,
                schedule: new Date(checkSchedule),
                user: { $ne: userId },
                tempLock: false
            },
            { $set: { tempLock: true } },
            { new: true, session }
        );

        if (partner) {
            // 🎯 Match found
            const myTicketId = myBooking._id.valueOf();
            const otherUserTicketID = partner._id.valueOf();
            const roomID = generateRandomString();

            // Update both users
            await userModel.findOneAndUpdate(
                { _id: userId },
                {
                    $push: {
                        bookings: {
                            myUserId: userId,
                            otherUserId: partner.user,
                            bookingTime: checkSchedule,
                            mockType,
                            myTicketId,
                            otherUserTicketID,
                            roomID
                        }
                    }
                },
                { session }
            );

            await userModel.findOneAndUpdate(
                { _id: partner.user },
                {
                    $push: {
                        bookings: {
                            myUserId: partner.user,
                            otherUserId: userId,
                            bookingTime: checkSchedule,
                            mockType,
                            myTicketId: otherUserTicketID,
                            otherUserTicketID: myTicketId,
                            roomID
                        }
                    }
                },
                { session }
            );

            // Mark myself as locked (finalized)
            await mockModel.findByIdAndUpdate(
                myBooking._id,
                { $set: { tempLock: true } },
                { session }
            );

            await session.commitTransaction();
            session.endSession();

            return res.send({
                message: "Your booking is confirmed, please check your profile",
                code: 2
            });
        } else {
            // 🙋 No match → stay waiting
            await session.commitTransaction();
            session.endSession();

            return res.send({
                message: "No one to schedule, we are adding you for booking",
                code: 3
            });
        }

    } catch (error) {
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
    const { myUserId, otherUserId, myTicketId, otherUserTicketID } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Remove booking entry for me
        await userModel.findOneAndUpdate(
            { _id: myUserId },
            { $pull: { bookings: { otherUserTicketID } } },
            { new: true, session }
        );

        // Remove booking entry for otherUser
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
