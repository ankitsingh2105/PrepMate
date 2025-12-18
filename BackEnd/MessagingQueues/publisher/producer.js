const amqplib = require("amqplib");
const connectToRabbitMQServer = require("../../config/rabbitmq");
async function publishBookingRequestToRabbitMQServer(userId, mockType, timeSlot){
    const dataJSON = {
        userId, mockType, timeSlot
    }

    let connection, channel;
    try{
        connection = await connectToRabbitMQServer(process.env.RABBITMQ_URI);
        channel = await connection.createChannel();
        // get the exchange and the routing key 
        const exchangeName = "slotBooking";
        const routingKeys = "slot.keys"
        
        // asserting the exchnage
        await channel.assertExchange(exchangeName, "direct", {
            durable : true
        })
        
        const dataBuffer = Buffer.from(JSON.stringify(dataJSON));
        
        channel.publish(exchangeName, routingKeys, dataBuffer);
        console.log("ok");

    }
    catch(error){
        console.log(error);
    }
    finally{
        if(channel) await channel.close();
        if(connection) await connection.close();
    }
}

module.exports = publishBookingRequestToRabbitMQServer;