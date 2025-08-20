const axios = require("axios");
const mongoose = require("mongoose");
const Mock = require("./Model/mockModel"); // Adjust path if needed
// const User = require("./User"); // Only needed if you create users programmatically

// MongoDB connection
const mongoURI = "mongodb+srv://WHQMCNBYGhTTwIHN:ankitchauhan21500@cluster0.2ipp9om.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const backEndLink = "https://prepmate-xld3.onrender.com";

// Your existing 5 users
const userIds = [
  "68a5fcd7e2f5b753ca3eb4d4",
  "68a5fce9e2f5b753ca3eb4d9",
  "68a5fcfce2f5b753ca3eb4de",
  "6845152d63b20924f23ea2e5", 
  "6843c36661c886b5836674f2"
];

const timeSlot = { date: "2025-08-21", time: "10:00" };
const mockType = "technical";

const totalRequests = 500;

// Step 0: Create test mock slot in MongoDB
async function createTestMock() {
  const mock = new Mock({
    mockType,
    schedule: new Date(`${timeSlot.date}T${timeSlot.time}:00Z`),
    tempLock: false
  });
  await mock.save();
  return mock._id;
}

// Step 1: Stress-test function
async function stressTest(mockId) {
  const requests = [];

  for (let i = 0; i < totalRequests; i++) {
    const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
    const payload = { mockType, timeSlot, userId: randomUserId };

    requests.push(
      axios
        .post(`${backEndLink}/user/checkAvailability`, payload)
        .then(res => ({
          userId: randomUserId,
          status: res.data.code,
          message: res.data.message
        }))
        .catch(err => ({ userId: randomUserId, error: err.message }))
    );
  }

  const results = await Promise.all(requests);
  console.log("Sample results (first 20):", results.slice(0, 20));

  // Count successful bookings
  const successful = results.filter(r => r.status === 2);
  console.log(`Total successful bookings: ${successful.length}`);
  console.log("Users who got the slot:", successful.map(r => r.userId));
}

// Step 2: Cleanup test slot
async function cleanup() {
  await Mock.deleteMany({ schedule: new Date(`${timeSlot.date}T${timeSlot.time}:00Z`) });
  console.log("Test slot cleaned up.");
}

// Run the full test
(async () => {
  try {
    const mockId = await createTestMock();
    console.log("Created test mock:", mockId);

    await stressTest(mockId);

  } catch (err) {
    console.error(err);
  } finally {
    await cleanup();
    mongoose.disconnect();
  }
})();
