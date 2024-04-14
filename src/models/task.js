const mongoose = require("mongoose");


const Schema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  uid: {
    type: String,
    required: true,
    trim: true,
  },
},{
  timestamps:true
});


const Task = mongoose.model("task",Schema);

module.exports = Task;
