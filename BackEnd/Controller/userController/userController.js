const userModel = require("../../Model/userModel");
const mockModel = require("../../Model/mockModel");
const mongoose = require("mongoose");
require("../../Model/notificationModel");
const publishBookingRequestToRabbitMQServer = require("../../producers/bookingPublisher")

async function handleUserInfo(req, response) {
    const { userName } = req.user;
    try {
        const userData = await userModel.findOne({ userName });
        const { email, name, _id, bookings, bio } = userData;
        response.status(200).send({ _id, userName, email, name, bookings, bio });
    } catch (error) {
        console.log("error :: ", error);
        response.status(404).send("Some Error Occured");
    }
}

async function handleAvailability(req, res) {
    const { timeSlot, mockType, userId } = req.body;
    const checkSchedule = new Date(timeSlot.date + " " + timeSlot.time);
    console.log(userId, typeof (userId), checkSchedule);

    try {
        try {
            let ifUserBookingExist = await mockModel.findOne({
                user: userId,
                mockType,
                schedule: checkSchedule
            });

            console.log("userController -> checking :: ", ifUserBookingExist);
            if (ifUserBookingExist) {
                return res.send({
                    message: "You cannot book two entries for the same time",
                    code: 1,
                });
            }
        }
        catch (error) {
            console.log("userController -> error :: ", error);
            return res.send({
                message: "You cannot book two entries for the same time",
                code: 19,
            });
        }
        try{
            await publishBookingRequestToRabbitMQServer(userId, mockType, timeSlot);
            console.log("ho gya");
            return res.send({
                message: "Your booking request is queued. You will be notified once confirmed.",
                code: 0
            });
        }
        catch(error){
            console.log("userController second error :: " , error);
        }
    }
    catch (error) {
        console.error("Error publishing booking request:", error);
        return res.status(500).send("Failed to queue booking request");
    }
}

async function getNotifications(req, res) {
    try {
        const { userName } = req.user;  // coming from cookie auth middleware
        console.log("getting ut notifications", userName);

        if (!userName) {
            return res.status(400).json({ message: "User not authenticated" });
        }

        const user = await userModel.findOne({ userName })
            .populate("notification")
            .exec();

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.json({ notifications: user.notification });

    } catch (err) {
        console.error("Error fetching notifications:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

function handleUserLogout(req, response) {
    console.log("logging out");
    response
        .clearCookie("token", {
            httpOnly: true,
            secure: true,
            sameSite: "None",
        })
        .send();
}

async function handleUpdateUserInfo(req, response) {
    console.log("updating info");
    console.log(req.body);
    const { email, name, bio } = req.body;
    try {
        let newUser = await userModel.findOneAndUpdate(
            { userName },
            {
                email,
                name,
                bio,
            }
        );
        console.log("new user :: ", newUser);
        response.send("User info updated");
    } catch (error) { }
}

async function handleCancelBooking(req, res) {
    const { myUserId, otherUserId, myTicketId, otherUserTicketID } = req.body;
    console.log("op");
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
        // $pull is update operator that help to remove elemet from array
        // $set is update operator for updating array elements  
        await userModel.findOneAndUpdate(
            { _id: otherUserId },
            { $pull: { bookings: { myTicketId: otherUserTicketID } } },
            { new: true, session }
        );
        console.log("myTicketId:", myTicketId, "otherUserTicketID:", otherUserTicketID);

        // Remove mock booking from myUser side
        await mockModel.findOneAndDelete({ _id: myTicketId }, { session });

        // Remove mock booking from otherUser side
        await mockModel.findOneAndUpdate({ _id: otherUserTicketID },
            {
                $set: { tempLock: false },
            },
            { session });

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        res.send("Booking cancelled successfully");
    }
    catch (error) {
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
    handleCancelBooking,
    getNotifications
};
