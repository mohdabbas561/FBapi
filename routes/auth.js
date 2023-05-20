const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const ErrorResponse = require("../utils/errorResponse");

//REGISTER
router.post("/register", async (req, res, next) => {
  const { email, username } = req.body;
  try {
    // Check that user exists by email
    const user = await User.findOne({ email });
    const Username = await User.findOne({ username });
    if (user) {
      // res.status(401).send("Email Already Used")
      res.status(401).json("Email Already Used")
      // return next(new ErrorResponse("User already registered", 500));
    }
     else if (Username) {
      res.status(401).send("Username Already Taken!")
      res.status(401).json("Username Already Taken!")
      // return next(new ErrorResponse("Username already used", 500));
    }
    else {
      //generate new password
      // const salt = await bcrypt.genSalt(10);
      // const hashedPassword = await bcrypt.hash(req.body.password, salt);

      //create new user
      const newUser = new User({
        username: req.body.username,
        email: req.body.email,
        password:
         req.body.password
        // hashedPassword 
        ,
      })
      //save user and respond
      const user = await newUser.save();
      // res.status(200).json(user);
      res.status(200).send("User Created");
    }
  } catch (err) {
    res.status(500).json(err)
  }
}
);

//LOGIN
router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password is provided
  if (!email || !password) {
    // return next(new ErrorResponse("Please provide an email and password", 400));
    res.status(401).send("Please provide an email and password")
    res.status(401).json("Please provide an email and password")
  }
  try {
    // Check that user exists by email
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      res.status(401).send("Invalid Email")
      res.status(401).json("Invalid Email")
      // return next(new ErrorResponse("Invalid Email", 401));
    }
    // Check that password match
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401).send("Invalid Password")
      res.status(401).json("Invalid Password")
      // return next(new ErrorResponse("Invalid Password"));
    }
    res.status(200).json(user)
  } catch (err) {
    // next(err);
  }


  // try {
  //   const user = await User.findOne({ email: req.body.email });
  //   !user && res.status(404).json("user not found");

  //   const validPassword = await bcrypt.compare(req.body.password, user.password)
  //   !validPassword && res.status(400).json("wrong password")

  //   res.status(200).json(user)
  // } catch (err) {
  //   res.status(500).json(err)
  // }
});

router.post("/forgotpassword", async (req, res, next) => {
  // Send Email to email provided but first check if user exists
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return next(new ErrorResponse("No email could not be sent", 404));
    }

    // Create reset url to email to provided email
    const resetUrl = `http://localhost:3000/passwordreset/${resetToken}`;

    // HTML Message
    const message = `
      <h1>You have requested a password reset</h1>
      <p>Please make a put request to the following link:</p>
      <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset Request",
        text: message,
      });

      res.status(200).json({ success: true, data: "Email Sent" });
    } catch (err) {
      console.log(err);
      await user.save();
      return next(new ErrorResponse("Email could not be sent", 500));
    }
  } catch (err) {
    next(err);
  }
});

router.post("/resetpassword", async (req, res, next) => {

  try {
    const user = await User.findOne({ userId });

    if (!user) {
      return next(new ErrorResponse("Invalid User", 400));
    }

    user.password = req.body.password;
    await user.save();

    res.status(201).json({
      success: true,
      data: "Password Updated Success",
    });
  } catch (err) {
    next(err);
  }
});
module.exports = router;
