const mongoose = require('mongoose');

const passwordSchema = new mongoose.Schema({
  username: { type: String, required: true },
  user: String,
  pass: String,
  site: String,
  order: Number //tracks order
});

const PasswordEntry = mongoose.model("PasswordEntry", passwordSchema, "passwordentries");

module.exports = PasswordEntry;
