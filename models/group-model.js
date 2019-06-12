const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GroupSchema = new Schema(
  {
    groupName: {
      type: String,
      // required: true,
      minlength: [5, "Name must be 5 characters long"],
      unique: true,
      required: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    description: {
      type: String,
      // required: true,
      minlength: [10, "Name must be 10 characters long"],
      required: true
    },
    basePicture: {
      type: String
    },
    member: [
      {
        type: String
      }
    ],

    category: {
      type: String,
      enum: [
        "Technologie",
        "Croyance",
        "Bien-Etre",
        "Developement personnel"
      ],
      required: true
    },
    Event: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Meetup",
        required: true
      }
    ]
  },
  {
    groupId: { type: String }
  },

  { timestamps: true }
);

const Group = mongoose.model("Group", GroupSchema);

module.exports = Group;
