const amqplib = require("amqplib");
const connectToRabbitMQServer = require("../config/rabbitmq");

async function publishBookingRequestToRabbitMQServer(userId, mockType, timeSlot){
    // lets connect
    // const connection = await connectToRabbitMQServer("amqp://guest:guest@localhost:5672");
    console.log("reached publsher.js :: the function of ")
    const connection = await connectToRabbitMQServer(process.env.RABBITMQ_URI);

    const channelToRabbitMQ = await connection.createChannel();
    const queueName = "booking_requests";
    
    await channelToRabbitMQ.assertQueue( queueName, {durable : true});
    // todo : durable means presist on restart


    const messageToPublish = {userId, mockType, timeSlot};

    channelToRabbitMQ.sendToQueue(queueName, Buffer.from(JSON.stringify(messageToPublish)) , {
        persistent : true
    });

    console.log("booking request published : " , messageToPublish);
    
    await channelToRabbitMQ.close();
    await connection.close();

}

module.exports = publishBookingRequestToRabbitMQServer;