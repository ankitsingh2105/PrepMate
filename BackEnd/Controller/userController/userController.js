
async function handleUserInfo(req, res) {
    console.log("Getting the user data");
    res.status(200).json({ message: "User data retrieved successfully" });
}

module.exports = {
    handleUserInfo
};
