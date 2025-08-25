const mongoose = require("mongoose");
const mockModel = require("../Model/mockModel");

async function cleanUp() {
    try {
        console.log("⏳ Connecting to MongoDB...");
        await mongoose.connect("mongodb+srv://WHQMCNBYGhTTwIHN:ankitchauhan21500@cluster0.2ipp9om.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");

        console.log("⚠️ Deleting all mockModel documents...");
        const result = await mockModel.deleteMany({});
        console.log(`✅ Deleted ${result.deletedCount} documents from mockModel`);
    } 
    catch (err) {
        console.error("❌ Error during cleanup:", err);
    } 
    finally {
        await mongoose.connection.close();
        console.log("🔌 MongoDB connection closed");
    }
}

cleanUp();
