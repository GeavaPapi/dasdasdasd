const mongoose = require("mongoose");

const serverSchema = mongoose.Schema({
  channelID: String,
  messageID: String,
  enddate: Date,
  position: Number

});

module.exports = mongoose.model("intervalsfirst", serverSchema)