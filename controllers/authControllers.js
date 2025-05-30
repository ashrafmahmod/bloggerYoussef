const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const sendEmail = require("../utiities/sendEmail");
const bcrypt = require("bcryptjs");
const {
  User,
  validateRegisterUser,
  validateLoginUser,
} = require("../models/userModel");
const VerificationToken = require("../models/verificationTokenModel");

/**--------------------------------------------------------------------
 * @desc  register new user
 * @route /api/auth/register
 * @method POST
 * @access public 
 --------------------------------------------------------------------*/

module.exports.registerUserCtrl = asyncHandler(async (req, res) => {
  // 1- Validation
  // 2- is user already exist
  // 3- hash password
  // 4- new user and save to db
  // 5- send respnse to client
  const { error } = validateRegisterUser(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  let user = await User.findOne({ email: req.body.email });
  if (user) {
    return res.status(400).json({ message: "User Already Exist" });
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);
  user = new User({
    username: req.body.username,
    email: req.body.email,
    password: hashedPassword,
  });
  await user.save();
  // sending email (verify account if not verifyed)
  // 1- create new verification token and save it in db
  // 2-  make the link
  // 3- put the link in html template
  // 4- send email to the user

  // step 1
  const verificationToken = new VerificationToken({
    userId: user._id,
    token: crypto.randomBytes(32).toString("hex"),
  });
  await verificationToken.save();
  // step 2 make the lonk
  // const link = `http://localhost:3000/users/:userId/verify/:token` // from App in frontend
  const link = `${process.env.CLIENT_DOMAIN}/users/${user._id}/verify/${verificationToken.token}`; // should front and backend be same path
  // step 3 put link in htmlTemplate
  const htmlTemplate = `
  <div>
  <p>Click on the link below to verify email</p>
  <a href= "${link}">verify </a>
  </div>
  `;

  // step 4 send email to user
  await sendEmail(user.email, "Verify your email", htmlTemplate);

  res.status(201).json({
    message:
      "We sent a verification link to your email pls check to verify your email and login",
  });
});

/**-----------------------------------------------------------------
 * @desc Login User
 * @route /api/auth/login
 * @method POST
 * @access public
 ------------------------------------------------------------------*/

module.exports.loginUserCtrl = asyncHandler(async (req, res) => {
  // 1- validation
  // 2- is user not exist in db
  // 3- check the password use bcrypt.compare(req.body.password=> frontEnd , user.password=>db Schema user from 2step)
  // 4- generate token
  // 5- send respnse to client
  const { error } = validateLoginUser(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(400).json({ message: "Invaild Email Or Password" });
  }
  const isPasswordMatch = await bcrypt.compare(
    req.body.password,
    user.password
  );
  if (!isPasswordMatch) {
    return res.status(400).json({ message: "Invaild Email Or Password" });
  }
  //  sending email (verify account if not verifyed)
  if (!user.isAccountVerified) {
    let verificationToken = await VerificationToken.findOne({
      userId: user._id,
    });
    if (!verificationToken) {
      verificationToken = new VerificationToken({
        userId: user._id,
        token: crypto.randomBytes(32).toString("hex"),
      });
      await verificationToken.save();
    }
    const link = `${process.env.CLIENT_DOMAIN}/users/${user._id}/verify/${verificationToken.token}`; // should front and backend be same path
    // step 3 put link in htmlTemplate
    const htmlTemplate = `
  <div>
  <p>Click on the link below to verify email</p>
  <a href= "${link}">verify </a>
  </div>
  `;

    // step 4 send email to user
    await sendEmail(user.email, "Verify your email", htmlTemplate);

    return res.status(400).json({
      message:
        "We sent a verification link to your email pls check to verify your email and login",
    });
  }
  const token = user.generateAuthToken();
  res.status(200).json({
    _id: user._id,
    isAdmin: user.isAdmin,
    profilephoto: user.profilephoto,
    token,
    username: user.username,
  });
});
/**-----------------------------------------------------------------
 * @desc Verify User Account
 * @route /api/auth/:userId/verify/:token
 * @method GET
 * @access public
 ------------------------------------------------------------------*/

module.exports.verifyUserAccountCtrl = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    return res.status(400).json({ message: "invalid link" });
  }
  const verificationToken = await VerificationToken.findOne({
    userId: user._id,
    token: req.params.token,
  });
  if (!verificationToken) {
    return res.status(400).json({ message: "invalid link=>" });
  }

  user.isAccountVerified = true;
  await user.save();

  // remove verification token from db coz i need it once
  await verificationToken.deleteOne();

  res.status(200).json({ message: "Your account verified" });
});
