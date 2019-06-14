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
  // const group = req.body.group;
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

          // res.json({ meetup: userUpdate, group: groupDoc });
        });
      });
    })
    .catch(err => next(err));
});

// Get the meetup fields
router.get("/meetup/:meetupId", (req, res, next) => {
  const { meetupId } = req.params;
  const user = req.user._id;
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
          let newArr = MeetupDoc.GotoEvent.map(i => {
            console.log(
              i._id.toString(),
              " + = ",
              user.toString()
            );
            // return i._id.indexOf(user) > 0 ? "yes" : "no";
            return i._id.toString() === user.toString()
              ? "yes"
              : "no";
          });
          console.log(newArr);
          res.json({
            meetupInf: MeetupDoc,
            userInf: userInfo,
            groupInf: groupDoc,
            test: [newArr]
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
  const { post, liker } = req.body;
  User.findByIdAndUpdate(
    liker,
    {
      $push: { eventToGo: post._id }
    },
    { runValidators: true, new: true }
  )
    .then(response => {
      response.encryptedPassword = undefined;
      Meetup.findByIdAndUpdate(
        post._id,
        {
          $push: { GotoEvent: response._id }
        },
        { runValidators: true, new: true }
      ).then(global => {
        res.json({ meetup: global, userInfo: response });
      });
    })
    .catch(err => next(err));
  // GotoEvent meetup model
  // eventToGo user model
});

// router.get("/search/:where", (req,res,next)=>{
//   const {where} = req.params
//   console.log(req.params)
//   House.find({"city" : {$eq : where}})
//   .then(houseDoc => res.json(houseDoc))
//   .catch(err=>next(err))
// })

// router.post("/search", (req, res, next) => {
//   const { arrayOfDates, where, guest } = req.body;
//   House.find({
//     city: { $eq: where },
//     availableDates: { $all: arrayOfDates },
//     accommodates: { $gte: guest }
//   })
//     .then(houseDoc => {
//       res.json(houseDoc);
//     })
//     .catch(err => next(err));
// });

// Get the houses that matches the user email then render it in the UserHouses component
// router.get("/userhouses", (req, res, next) => {
//   House.find({ owner: { $eq: req.user._id } })
//     .then(houseDoc => res.json(houseDoc))
//     .catch(err => next(err));
// });

// Delete a house
// router.delete("/deletehouse/:id", (req, res, next) => {
//   const { id } = req.params;

//   House.findByIdAndRemove(id)
//     .then(houseDoc => {
//       res.send(houseDoc);
//     })
//     .catch(err => next(err));
// });

// Edit a house - Form in the EditPlace component
// router.put("/houses/:id", (req, res, next) => {
//   const { id } = req.params;
//   const {
//     property_type,
//     room_type,
//     accommodates,
//     beds,
//     bedrooms,
//     bathrooms,
//     neighbourhood,
//     amenities,
//     name,
//     description,
//     country,
//     city,
//     price,
//     xl_picture_url,
//     xl_picture_url_2,
//     xl_picture_url_3
//   } = req.body;

//   House.findByIdAndUpdate(
//     id,
//     {

//       $set: {
//         property_type,
//         room_type,
//         accommodates,
//         beds,
//         bedrooms,
//         bathrooms,
//         neighbourhood,
//         amenities,
//         name,
//         description,
//         country,
//         city,
//         price,
//         xl_picture_url,
//         xl_picture_url_2,
//         xl_picture_url_3
//       }
//     },
//     { runValidators: true, new: true }
//   )
//     .then(houseDoc => {
//       res.send(houseDoc);
//     })
//     .catch(err => {
//       console.log("Something went wrong", err);
//     });
// });

// router.post("/booking/:houseId", (req, res, next) => {
//   const { arrayOfDates, where, guests, price, currentUser } = req.body;
//   const { houseId } = req.params;
//   Booking.create({ arrayOfDates, guests, houseId, price, currentUser })
//     .then(userDoc => {
//       res.json(userDoc);
//     })
//     .catch(err => next(err));
// });

// router.get("/bookings-list", (req, res, next) => {
//   Booking.find({ currentUser: { $eq: req.user._id } })
//     .populate("houseId")
//     .sort({ createdAt: -1 })
//     .then(currentUser => res.json(currentUser))
//     .catch(err => next(err));
// });

module.exports = router;

//*******************************************************************
//***********************************************************************//
// const express = require("express");
// const mongoose = require("mongoose");

// const Meetup = require("../models/meetup-model");

// const meetupRouter = express.Router();

// meetupRouter.post("/meetup", (req, res, next) => {
//   const { title, description } = req.body;
//   // const owner = res.user._id;

//   Meetup.create({
//     title,
//     description
//     // , owner
//   })
//     .then(response => {
//       res.status(200).json(response);
//     })
//     .catch(err => {
//       res.json(err);
//     });
// });

// meetupRouter.get("/meetup", (req, res, next) => {
//   Meetup.find()
//     .populate("group")
//     .then(allMeetups => {
//       res.json(allMeetups);
//     })
//     .catch(err => {
//       res.json(err);
//     });
// });

// meetupRouter.get("/meetup/:meetupId", (req, res, next) => {
//   const { meetupId } = req.params;
//   Meetup.findById(meetupId)
//     .then(meeDoc => res.json(meeDoc))
//     .catch(err => next(err));
// });
//

// // Put route => update a specifiq item
// meetupRouter.put("/meetups/:id", (req, res, next) => {
//   if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//     res.status(400).json({ message: "Specified id is not valid" });
//     return;
//   }

//   Meetup.findByIdAndUpdate(req.params.id, req.body)
//     .then(() => {
//       res.json({
//         message: `Meetup with ${req.params.id} is updated successfully.`
//       });
//     })
//     .catch(err => {
//       res.json(err);
//     });
// });

// // DELETE route => to delete a specific meetup
// meetupRouter.delete("/meetups/:id", (req, res, nex) => {
//   if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//     res.status(400).json({ message: "Specified id is not valid" });
//     return;
//   }
//   Meetup.findOneAndRemove(req.params.id)
//     .then(() => {
//       res.json({
//         message: `Meetup with ${req.params.id} is removed successfully.`
//       });
//     })
//     .catch(err => {
//       res.json(err);
//     });
// });

// module.exports = meetupRouter;
