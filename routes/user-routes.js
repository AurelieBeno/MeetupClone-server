const express = require("express");
const User = require("../models/user-model.js");
const Meetup = require("../models/meetup-model.js");
const Group = require("../models/group-model.js");
const router = express.Router();

router.get("/my-profil", (req, res, next) => {
  const userId = req.user._id;

  User.findById(userId)
    .populate("followGroup")
    .then(response => {
      response.encryptedPassword = undefined;
      let groupF = response.followGroup;
      console.log("groupFollow", " ", groupF);
      console.log("user info", response);
      res.json({ userInfo: [response] });
    })
    .catch(err => {
      next(err);
    });
  console.log("coucou backend my profil");
});

module.exports = router;
