
const connectToRabbitMQServer = require("../config/rabbitmq");

async function publishBookingRequestToRabbitMQServer(userId, mockType, timeSlot){

    console.log("reached publsher.js :: the function of ")
    let connection;
    try{
        connection = await connectToRabbitMQServer(process.env.RABBITMQ_URI);
    }
    catch(err){
        console.log("error in connecting to rabbitmq server in bookingPublisher.js :: " , err);
        return;
    }

    let channelToRabbitMQ;
    try{
        channelToRabbitMQ = await connection.createChannel();
        // a channel is like a virtual connection inside a connection - a virtual connections in a TCP connections
        // multiple channels can be created on a single connection
        // channels are used to perform most of the operations (like publishing and consuming messages) in RabbitMQ
    }
    catch(err){
        console.log("error in creating channel in bookingPublisher.js :: " , err);
        return;
    }
    const queueName = "booking_requests";
    
    try{
        await channelToRabbitMQ.assertQueue( queueName, {durable : true});
        // todo : durable means presist on restart
        // check if exists else create
        // if server goes down the queue will still be there
        // meta data is stored on disk - not in memory
        // disk exist in rabbitmq server machine
    }
    catch(err){
        console.log("error in asserting queue in bookingPublisher.js :: " , err);
        return;
    }
    
    const messageToPublish = {userId, mockType, timeSlot};

    channelToRabbitMQ.sendToQueue(queueName, Buffer.from(JSON.stringify(messageToPublish)) , {
        persistent : true
    });

    // todo : persistent means message will not be lost even if rabbitmq server restarts
    // todo : but for persistent to work the queue must be durable as well

    console.log("booking request published : " , messageToPublish);
    
    await channelToRabbitMQ.close();
    await connection.close();

}

module.exports = publishBookingRequestToRabbitMQServer;