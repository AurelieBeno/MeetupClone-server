const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    // document structure & rules defined here
    fullName: {
      type: String,
      required: true,
      minlength: 2
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /^.+@.+\..+$/
    },
    // avatar: {
    //   type: String
    //   // required: true
    // },
    createdEvent: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Meetup",
        required: true
      }
    ],
    myGroup: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group"
      }
    ],
    encryptedPassword: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["normal", "admin"],
      required: true,
      default: "normal"
    },
    eventToGo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meetup"
    },
    followGroup: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group"
    }]
  },

  {
    // additional settings for the Schema class
    timestamps: true
  }
);

// "User" model -> "users" collection
const User = mongoose.model("User", userSchema);

module.exports = User;
