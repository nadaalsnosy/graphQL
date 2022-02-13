const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/social', () => {
  console.log('db connected');
});
