const mongoose = require("mongoose");

const serverSchema = mongoose.Schema({
  channelID: String,
  messageID: String,
  userID: String,
  guildID: String,
  enddate: Date,
  position: Number

});

module.exports = mongoose.model("intervalsthird", serverSchema)