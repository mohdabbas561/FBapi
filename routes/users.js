const User = require("../models/User");
const router = require("express").Router();
const bcrypt = require("bcrypt");
const { db } = require("../models/User");

//update user
router.put("/:id", async (req, res) => {
  if (req.body.userId === req.params.id || req.body.isAdmin) {
    // if (req.body.password === req.params.password) {
    // if (req.body.password) {
    //   try {
    //     const salt = await bcrypt.genSalt(10);
    //     req.body.password = await bcrypt.hash(req.body.password, salt);
    //   } catch (err) {
    //     return res.status(500).json(err);
    //   }
    // }
    try {
      // const user =
      await User.findByIdAndUpdate(req.params.id, {
        $set: req.body,
      });
      res.status(200).json("Account has been updated");
    } catch (err) {
      return res.status(500).json(err);
    }
    // }
  } else {
    return res.status(403).json("You can update only your account!");
  }
});

//delete user
router.delete("/:id", async (req, res) => {
  // if (req.body.userId === req.params.id || req.body.isAdmin) {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json("Account has been deleted");
  } catch (err) {
    return res.status(500).json(err);
  }
  // } else {
  //   return res.status(403).json("You can delete only your account!");
  // }
});

//get a user
router.get("/", async (req, res) => {
  const userId = req.query.userId;
  const username = req.query.username;
  try {
    const user = userId
      ? await User.findById(userId)
      : await User.findOne({ username: username });
    const { password, updatedAt, ...other } = user._doc;
    res.status(200).json(other);
  } catch (err) {
    res.status(500).json(err);
  }
});

//get all user
router.get("/searchAll", async (req, res, next) => {
  const Alluser = await User.find({}).sort({ _id: -1 }).limit(5);
  try {
    // const fr = await Promise.all(
    //   Alluser.map((d) => {
    //     return User.find({});
    //   })
    // );
    let frList = [];
    Alluser.map((d) => {
      const { _id, username, profilePicture, desc } = d;
      frList.push({ _id, username, profilePicture, desc });
    });
    res.status(200).send(frList)
    // console.log(Alluser)
    // res.json(Alluser)
    // res.status(200).send(Alluser);
  }
  catch (err) {
    res.status(500).json(err);
    next(err);
  }
}
);
//GET ALL
router.get("/All", async (req, res) => {
  // if (req.user.isAdmin) {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json(err);
  }
  // } else {
  // res.status(403).json("You are not allowed to see all users!");
  // }
});
//GET ALL
router.get("/fetch", async (req, res) => {
  const query = req.params._id;
  console.log(query)
  // const usersLists = await User.find({}).sort({ _id: -1 }).limit(5);

  try {
    const usersLists = await User.find({}).limit(8);
    let frList = [];
    usersLists.map((d) => {

      const { followings } = d;
      frList.push({ followings });
    });
    res.status(200).json(usersLists);
    // res.status(200).json(frList);
  } catch (err) {
    res.status(500).json(err);
  }
  // } else {
  //   res.status(403).json("You are not allowed to see all users!");
  // }
});

//GET USER STATS
router.get("/stats", async (req, res) => {
  const today = new Date();
  const latYear = today.setFullYear(today.setFullYear() - 1);

  try {
    const data = await User.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json(data)
  } catch (err) {
    res.status(500).json(err);
  }
});

//get searched user
router.get("/search", async (req, res, next) => {
  const { name } = req.body;
  // const username = req.query.username;
  console.log({ name })
  // if (req.body.userId !== req.params.id) {
  try {
    // const Alluser = await User.find({},{username:1});
    const Alluser = await User.find({ name: name }, { username: 1 });
    // const Alluser = await User.find({username:username});
    console.log(Alluser)
    res.json(Alluser)
    res.status(200)
  }
  catch (err) {
    // res.status(500).json(err);
    next(err);
  }
}
);

// router.get("/users", (req, res, next) => {
//   const searchfield = req.query.username;
//   User.find({ username: { $regex: searchfield, $options: "$i" } }).then(data => {
//     res.send(data);
//   })
// })

//get friends
router.get("/friends/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const friends = await Promise.all(
      user.followings.map((friendId) => {
        return User.findById(friendId);
      })
    );
    let friendList = [];
    friends.map((friend) => {
      const { _id, username, profilePicture, name } = friend;
      friendList.push({ _id, username, profilePicture, name });
    });
    res.status(200).json(friendList)
  } catch (err) {
    res.status(500).json(err);
  }
});

//follow a user

router.put("/:id/follow", async (req, res) => {
  if (req.body.userId !== req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);
      if (!user.followers.includes(req.body.userId)) {
        await user.updateOne({ $push: { followers: req.body.userId } });
        await currentUser.updateOne({ $push: { followings: req.params.id } });
        res.status(200).json("user has been followed");
      } else {
        res.status(403).json("you allready follow this user");
      }
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json("you cant follow yourself");
  }
});

//unfollow a user

router.put("/:id/unfollow", async (req, res) => {
  if (req.body.userId !== req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);
      if (user.followers.includes(req.body.userId)) {
        await user.updateOne({ $pull: { followers: req.body.userId } });
        await currentUser.updateOne({ $pull: { followings: req.params.id } });
        res.status(200).json("user has been unfollowed");
      } else {
        res.status(403).json("you dont follow this user");
      }
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json("you cant unfollow yourself");
  }
});

module.exports = router;
