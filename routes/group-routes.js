const express = require("express");

const Meetup = require("../models/meetup-model");

const User = require("../models/user-model");

const Group = require("../models/group-model");

const groupRouter = express.Router();

groupRouter.post(
  "/create-group",
  async (req, res, next) => {
    const { groupName, description, category } = req.body;
    const owner = req.user._id;

    // console.log("REQ.BODY ", req.user._id);
    if (!groupName) {
      return res.status(400).json({
        error: true,
        message: "groupName must be provided "
      });
    } else if (typeof groupName !== "string") {
      return res.status(400).json({
        error: true,
        message: "groupName must be provided "
      });
    }
    if (!description) {
      return res.status(400).json({
        error: true,
        message: "description must be provided "
      });
    } else if (typeof description !== "string") {
      return res.status(400).json({
        error: true,
        message: "description must be provided "
      });
    } else if (description.length < 5) {
      return res.status(400).json({
        error: true,
        message: "description must have 5 characters"
      });
    }
    if (!category) {
      return res.status(400).json({
        error: true,
        message: "category must be provided "
      });
    } else if (typeof category !== "string") {
      return res.status(400).json({
        error: true,
        message: "category must be provided "
      });
    } else if (category.length < 2) {
      return res.status(400).json({
        error: true,
        message: "category must have 5 characters"
      });
    }
    Group.create({
      groupName,
      description,
      category,
      owner: req.user._id
    })
      .then(groupDoc => {
        console.log("*****GROUPDOC");
        console.log(groupDoc);
        User.findOneAndUpdate(
          { _id: { $eq: groupDoc.owner } },
          { $push: { myGroup: groupDoc._id } },
          { runValidators: true, new: true }
        ).then(userDoc => {
          userDoc.encryptedPassword = undefined;
          res.json({
            newGroup: groupDoc,
            userInfo: userDoc
          });
        });
      })
      .catch(err => next(err));
  }
);

groupRouter.get("/group/:groupId", (req, res, next) => {
  const { groupId } = req.params;
  const user = req.user._id;
  Group.findById(groupId)
    .populate("Event")
    .populate("GotoEvent")
    .populate("owner", "fullName")
    .then(gDoc => {
      //////////// if user is owner////////////
      let checkOwner = gDoc.owner._id;
      let checkO =
        JSON.stringify(checkOwner) === JSON.stringify(user)
          ? "yes"
          : "no";
      //////////// if user is member////////////
      let checkM = [];
      function checkUser() {
        gDoc.member.map(i => {
          JSON.stringify(i) === JSON.stringify(user)
            ? checkM.push(i)
            : "not member";
          return checkM;
        });
      }
      checkUser();
      //////////// Event details ////////////
      // console.log(gDoc.Event);
      Meetup.find({ group: { $eq: groupId } }).then(res => {
        let resultTest = res.map(el => ({
          name: el.name,
          description: el.description,
          date: el.eventDate
        }));
        console.log("heelo resultTes");
        console.log(resultTest);
      });
      res.json({
        groupInfo: [gDoc],
        res: checkO,
        checkUser: checkM
      });
    })

    .catch(err => next(err));
});

groupRouter.post("/process-member", (req, res, next) => {
  const liker = req.user._id;
  const group = req.body;
  console.log("like*********", liker);
  console.log("********group*******", group.group);

  Group.findOneAndUpdate(
    { _id: { $eq: group.group } },
    { $push: { member: liker } },
    { runValidators: true, new: true }
  ).then(response => {
    console.log("********response-GROUP****");
    console.log(response);
    User.findOneAndUpdate(
      {
        _id: { $eq: liker }
      },
      { $push: { followGroup: group.group } },
      { runValidators: true, new: true }
    ).then(responseUsr => {
      res.json({
        groupadd: response,
        userAdd: responseUsr
      });
    });
  });
});

// .catch(err => next(err));

// Group.findOneAndUpdate(
//   group,
//   {
//     $push: { member: liker }
//   },
//   {
//     runValidators: true,
//     new: true
//   }
// )
//   .then(response => {
//     console.log("group Update ", " ", response);
//     // User.findById(liker).then(upd => {
//     //   console.log(
//     //     "upd",
//     //     " ",
//     //     upd._id,
//     //     " et",
//     //     " ",
//     //     response
//     //   );
//     // });

//     // User.findByIdAndUpdate(
//     //   liker,
//     //   {
//     //     $push: { followGroup: group }
//     //   },
//     //   { runValidators: true, new: true }
//     // ).then(userUpdate => {
//     //   userUpdate.encryptedPassword = undefined;
//     //   // console.log("userUpdate", userUpdate);
//     //   res.json({ groupAdd: response });
//     // });
//  })
// .catch(err => next(err));

//  router.post("/add-meetup", async (req, res, next) => {
//   try {
//     const { name, description, eventDate } = req.body;
//     const createBy = req.user._id;
//     const currentUser = req.user.fullName;

//     console.log("****** ADD-MEETUP REQ.USER********");
//     // console.log(req.user);
//     const newMeetup = await Meetup.create({
//       name,
//       description,
//       eventDate
//     });
//     const user = await User.findById(createBy);
//     newMeetup.createBy = user;
//     user.createdEvent.push(newMeetup);
//     user.save();
//     await newMeetup.save();

//     res.status(200).json({ newMeetup: currentUser });
//   } catch (err) {
//     res.status(400).json({ error: err });
//   }
// });

module.exports = groupRouter;

//***************************** */
//   const { meetupId } = req.params;
//   Meetup.findById(meetupId)
//     .then(meetup => {
//       let promise;
//       if (req.session.meetupGroup) {
//         // update the existing meetup
//         promise = Group.findByIdAndUpdate(
//           req.session.meetupGroup,
//           {
//             $push: { newmeetup: meetupId }
//           },
//           {
//             runValidators: true,
//             new: true
//           }
//         );
//       } else {
//         // create meetup
//         promise = Group.create({
//           newmeetup: [meetupId]
//         });
//       }
//       promise
//         .then(meetup => {
//           // saving the session
//           req.session.userOrder = order._id;
//           res.json(order);
//         })
//         .catch(err => next(err));
//     })
//     .catch();
// });
