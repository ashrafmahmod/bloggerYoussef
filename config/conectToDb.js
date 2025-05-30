const mongoose = require("mongoose");

module.exports = async () => {
  try {
    await mongoose.connect(process.env.MONGO_CLOUD_URI);
    console.log("Connected To MongoDb");
  } catch (error) {
    console.log("Connection Failed To MongoDb !", error);
  }
};
