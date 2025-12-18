const amqp = require("amqplib");
const connectToRabbitMQServer = require("../../config/rabbitmq");

async function createExchange(){
    let connection, channel;
    try{
        connection = await connectToRabbitMQServer(process.env.RABBITMQ_URI);
        channel = await connection.createChannel();

        // define the exchnage name and name of the asscocated queues

        const exchangeName = "slotBooking";
        const routingKeys = "slot.keys"
        const bookingQueue = "booking_service_queue";
        // const notificationQueue = "notification_service_queue";

        // asserting exchnage and queues

        await channel.assertExchange(exchangeName, "direct", {
            durable : true
        })

        await channel.assertQueue(bookingQueue, {
            durable : true
        });

        // await channel.assertQueue(notificationQueue, {
        //     durable : true
        // });
        
        // binding the queue to this exchange only
        
        await channel.bindQueue(bookingQueue, exchangeName, routingKeys);
        // await channel.bindQueue(notificationQueue, exchangeName, routingKeys);
        console.log("Exchnage successful");
    }
    catch(error){
        console.log(error);
    }
    finally{
        if(channel) await channel.close();
        if(connection) await connection.close();
    }
}

module.exports = createExchange;