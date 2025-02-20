/* eslint-disable linebreak-style */
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  age: Number,
  firstName: String,
  lastName: String,
});


const User = mongoose.model('User', userSchema);

module.exports = User;
