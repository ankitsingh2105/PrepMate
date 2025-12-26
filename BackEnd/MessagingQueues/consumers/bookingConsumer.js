const mongoose = require("mongoose");
const mockModel = require("../../Model/mockModel");
const userModel = require("../../Model/userModel");
const generateRandomString = require("../../utils/generateRandomString");
const connectToRabbitMQServer = require("../../config/rabbitmq");
const connectToMongoDB = require("../../config/mongodbAtlas");
const notoficationModel = require("../../Model/notificationModel");
async function bookingConsumer() {
    console.log("Starting Booking Worker...");
    const connection = await connectToRabbitMQServer(process.env.RABBITMQ_URI);
    await connectToMongoDB(process.env.MONGO_URI);

    const channel = await connection.createChannel();
    // Must match the queue bound to the `slotBooking` exchange in `MessagingQueues/exchanges/exchange.js`
    const bookingQueue = "booking_service_queue";

    await channel.assertQueue(bookingQueue, { durable: true });
    channel.prefetch(1); // process one message at a time

    console.log("Booking worker started, waiting for messages...");

    channel.consume(bookingQueue, async (msg) => {
        if (!msg) {
            console.log("Received empty message, skipping...");
            return;
        }

        console.log("Received message:", msg.content.toString());

        const { userId, mockType, timeSlot } = JSON.parse(msg.content.toString());
        const checkSchedule = new Date(timeSlot.date + " " + timeSlot.time);
        console.log(`Parsed message -> userId: ${userId}, mockType: ${mockType}, schedule: ${checkSchedule}`);

        const session = await mongoose.startSession();
        try {
            console.log("Starting MongoDB transaction for booking...");
            session.startTransaction();

            // Step 1: Create booking for this user
            console.log("Creating booking for user:", userId);
            const myBooking = new mockModel({
                mockType,
                schedule: checkSchedule,
                user: userId,
            });

            try {
                await myBooking.save({ session });
                console.log("Booking saved for user:", userId);
            }
            catch (error) {
                if (error.code === 11000) {
                    console.log("Duplicate booking detected for user:", userId);
                    await session.abortTransaction();
                    session.endSession();
                    channel.ack(msg);
                    return;
                }
                throw error;
            }

            // Step 2: Lock conflicting booking atomically
            // ne is not equal to userId
            console.log("Checking for conflicting bookings...");
            const isBookingAvailable = await mockModel.findOneAndUpdate(
                {
                    mockType,
                    schedule: checkSchedule,
                    user: { $ne: userId },
                    isAvailable: false,
                },
                { $set: { isAvailable: true } },
                { new: true, session }
            );

            if (isBookingAvailable) {
                const otherUserID = isBookingAvailable.user.valueOf();
                const otherUserTicketID = isBookingAvailable._id.valueOf();
                const bookingId = myBooking._id.valueOf();
                const roomID = generateRandomString();

                console.log(`Pairing user ${userId} with user ${otherUserID} in room ${roomID}`);

                await mockModel.findOneAndUpdate(
                    {
                        mockType,
                        schedule: checkSchedule,
                        user: userId,
                    },
                    { $set: { isAvailable: true } },
                    { new: true, session }
                );

                console.log("Booking confirmed for both users:", userId, otherUserID);
                const currentDate = new Date();

                const notificationForOtherUser = new notoficationModel({
                    message: `Your booking is confirmed for ${timeSlot.date} at ${timeSlot.time}`,
                    createdAt: currentDate
                })
                await notificationForOtherUser.save({ session });

                const notificationForMyself = new notoficationModel({
                    message: `Your booking is confirmed for ${timeSlot.date} at ${timeSlot.time}`,
                    createdAt: currentDate
                })
                await notificationForMyself.save({ session });

                // Step 3: Update both users
                await userModel.findByIdAndUpdate(
                    userId,
                    {
                        $push: {
                            bookings: {
                                myUserId: userId,
                                otherUserId: otherUserID,
                                bookingTime: checkSchedule,
                                mockType,
                                myTicketId: bookingId,
                                otherUserTicketID,
                                roomID,
                            },
                            notification: notificationForMyself._id
                        }
                    },
                    { session }
                );



                await userModel.findByIdAndUpdate(
                    otherUserID,
                    {
                        $push: {
                            bookings: {
                                myUserId: otherUserID,
                                otherUserId: userId,
                                bookingTime: checkSchedule,
                                mockType,
                                myTicketId: otherUserTicketID,
                                otherUserTicketID: bookingId,
                                roomID,
                            },
                            notification: notificationForOtherUser._id
                        }
                    },
                    { session }
                );


            }
            else {
                console.log("No one available to pair. Releasing isAvailable for user:", userId);
                await myBooking.updateOne({ $set: { isAvailable: false } }, { session });
            }

            // Step 4: Commit transaction
            await session.commitTransaction();
            session.endSession();
            console.log("Transaction committed for user:", userId);
            channel.ack(msg);

        }
        catch (error) {
            console.error("Error processing booking for user:", userId, error);
            await session.abortTransaction();
            session.endSession();
            channel.nack(msg, false, true); // retry the message
        }
    });
}

module.exports = bookingConsumer;
