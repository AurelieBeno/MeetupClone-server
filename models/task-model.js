const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Meetup = require("./meetup-model");

const taskSchema = new Schema({
  title: String,
  description: String,
  meetup: { type: Schema.Types.ObjectId, ref: "Meetup" }
});

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
