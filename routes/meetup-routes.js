const express = require("express");
// const House = require("../models/house-model.js");

const User = require("../models/user-model.js");
const Meetup = require("../models/meetup-model.js");
const Group = require("../models/group-model.js");
const router = express.Router();

// $nin

router.get("/meetup", (req, res, next) => {
  Meetup.find({ eventDate: { $gt: new Date() } })
    .populate("createBy", "fullName")
    .populate("group", "groupName")
    .populate("GotoEvent", "fullName")
    .sort({ eventDate: 1 })
    .then(meDoc => {
      let checkD = [];
      console.log(meDoc);
      function checkDate() {
        let event = meDoc.map(item => {
          item.eventDate > new Date()
            ? checkD.push(item.eventDate)
            : item.eventDate;
          return checkD;
        });
      }
      checkDate();

      res.json({
        meetupInfo: meDoc,
        event: checkD
      });
    })
    .catch(err => next(err));
});

router.get("/add-meetup", async (req, res, next) => {
  const currentUser = req.user._id;

  User.findById(currentUser)
    .populate("myGroup", "groupName")
    .populate("eventToGo")
    .then(userDoc => {
      userDoc.encryptedPassword = undefined;
      console.log("********USeRDOc*********");
      console.log(userDoc);
      let id = userDoc._id;
      Group.find({ owner: { $eq: id } }).then(groupDoc => {
        console.log("************GroupDOC");
        console.log(groupDoc);
        res.json({ user: userDoc, group: groupDoc });
      });
    })
    .catch(err => next(err));
});

// Create a meetup when the login form is submitted
router.post("/add-meetup", async (req, res, next) => {
  const { name, description, eventDate, group } = req.body;

  const createBy = req.user._id;

  Meetup.create({
    name,
    description,
    eventDate,
    createBy
  })
    .then(MeetupDoc => {
      console.log("heelo group.body");
      console.log(group);
      Group.findOneAndUpdate(
        { groupName: { $eq: group } },
        { $push: { Event: MeetupDoc._id } },
        { runValidators: true, new: true }
      ).then(groupDoc => {
        Meetup.findOneAndUpdate(
          {
            _id: { $eq: MeetupDoc._id }
          },
          { $push: { group: groupDoc._id } },
          { runValidators: true, new: true }
        ).then(userUpdate => {
          let id = userUpdate.createBy;
          User.findOneAndUpdate(
            { _id: { $eq: id } },

            {
              $push: { createdEvent: userUpdate._id }
            },
            {
              runValidators: true,
              new: true
            }
          ).then(userOk => {
            userOk.encryptedPassword = undefined;

            res.json({
              meetup: userUpdate,
              userinf: userOk
            });
          });

          res.json({ meetup: userUpdate, group: groupDoc });
        });
      });
    })
    .catch(err => next(err));
});

// Get the meetup fields
router.get("/meetup/:meetupId", (req, res, next) => {
  const { meetupId } = req.params;
  const user = req.user._id;
  // console.log(req.user._id, " userId meetupDetails");
  Meetup.findById(meetupId)
    .populate("GotoEvent", "fullName")

    .then(MeetupDoc => {
      Group.findById(MeetupDoc.group).then(groupDoc => {
        // console.log("groupInfo", " ", groupDoc);
        User.findOne({
          _id: { $eq: MeetupDoc.createBy }
        }).then(userInfo => {
          userInfo.encryptedPassword = undefined;
          console.log("*********UserDoc***********");
          console.log(userInfo);
          console.log("*********MeetupDoc***********");
          let checkMember = [];
          function checkMe() {
            MeetupDoc.GotoEvent.map(i => {
              i._id.toString() === user.toString()
                ? checkMember.push(i)
                : "no";

              return checkMember;
            });
          }
          checkMe();
          console.log(checkMember);

          res.json({
            meetupInf: MeetupDoc,
            userInf: userInfo,
            groupInf: groupDoc,
            test: [checkMember]
          });
        });
      });
    })
    .catch(err => {
      next(err);
    });
});

router.get("/my-meetup", (req, res, next) => {
  const id = req.user._id;
  User.findById(id)
    .populate("createdEvent")
    .populate("eventToGo")
    .then(userDoc => {
      let id = userDoc._id;
      console.log(id);
      userDoc.encryptedPassword = undefined;
      Meetup.find({ createBy: { $eq: id } })
        .populate("GotoEvent", " fullName")
        .then(response => {
          console.log(response);
          res.json({
            createdEvent: response,
            userInfo: userDoc
          });
        });
    })
    .catch(err => next(err));
});

router.post("/process-goTo", (req, res, next) => {
  const { event, user } = req.body;
  const eventId = event.map(i => i._id);
  User.findByIdAndUpdate(
    user,
    {
      $push: { eventToGo: eventId }
    },
    { runValidators: true, new: true }
  )
    .then(response => {
      response.encryptedPassword = undefined;
      // console.log(event._id);
      Meetup.findByIdAndUpdate(
        eventId,
        {
          $push: { GotoEvent: response._id }
        },
        { runValidators: true, new: true }
      ).then(global => {
        res.json({ meetup: global, userInfo: response });
      });
    })
    .catch(err => next(err));
  //  GotoEvent meetup model
  //  eventToGo user model
});

router.post("/edit-meetup", (req, res, next) => {
  const { newName, description, eventId } = req.body;
  console.log(newName, "", eventId);

  Meetup.findByIdAndUpdate(eventId, {
    $set: { name: newName, description: description }
  }).then(newEvent => {
    console.log("******New Event ********");
    console.log(newEvent);
  });
});

module.exports = router;
