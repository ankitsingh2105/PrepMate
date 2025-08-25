const amqplib = require("amqplib");

async function connectToRabbitMQServer(uri) {
    try {
        const conn = await amqplib.connect(uri);
        console.log("✅ Connected to RabbitMQ");
        return conn;
    } catch (err) {
        console.error("❌ RabbitMQ connection failed:", err.message);
        throw err; 
    }
}


module.exports = connectToRabbitMQServer