const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const sendEmail = require("../utiities/sendEmail");
const bcrypt = require("bcryptjs");
const {
  User,
  validateEmail,
  validateNewPassword,
} = require("../models/userModel");
const VerificationToken = require("../models/verificationTokenModel");
/**--------------------------------------------------------------------
 * @desc  sent reset password link
 * @route /api/password/reset-password-link
 * @method POST
 * @access public 
 --------------------------------------------------------------------*/

module.exports.sendResetPasswordLinkCtrl = asyncHandler(async (req, res) => {
  // 1- validation
  // 2- get user from Db by email
  // 3- creating verificationToken
  // 4- creating link
  // 5- creating html template
  // 6- sending email
  // 7- send res to client

  // step 1
  const { error } = validateEmail(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  // step
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).json({ message: "user not exist" });
  }
  // step 3
  let verficationToken = await VerificationToken.findOne({
    userId: user._id,
  });
  if (!verficationToken) {
    verficationToken = new VerificationToken({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex"),
    });
    await verficationToken.save();
  }
  // step 4
  const link = `${process.env.CLIENT_DOMAIN}/reset-password/${user._id}/${verficationToken.token}`; //path in frontend
  // step 5
  const htmlTemplate = ` <a href = "${link}">Click here to reset your password</a>`;
  await sendEmail(user.email, "reset password", htmlTemplate);
  res.status(200).json({
    message: "password reset link sent to your email , pls check your inbox",
  });
});

/**--------------------------------------------------------------------
 * @desc  get reset password link
 * @route /api/password/reset-password/:userId/:token
 * @method GET
 * @access public 
 --------------------------------------------------------------------*/
module.exports.getResetPasswordLinkCtrl = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    return res.status(400).json({ message: "invalid link " });
  }

  const verficationToken = await VerificationToken.findOne({
    userId: user._id,
    token: req.params.token,
  });

  if (!verficationToken) {
    return res.status(400).json({ message: "invalid link  " });
  }
  res.status(200).json({ message: "valid url" });
});

/**--------------------------------------------------------------------
 * @desc  reset password 
 * @route /api/password/reset-password/:userId/:token
 * @method POST
 * @access public 
 --------------------------------------------------------------------*/

module.exports.resetPasswordCtrl = asyncHandler(async (req, res) => {
  const { error } = validateNewPassword(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const user = await User.findById(req.params.userId);
  if (!user) {
    return res.status(400).json({ message: "invalid link" });
  }

  const verficationToken = await VerificationToken.findOne({
    userId: user._id,
    token: req.params.token,
  });
  if (!verficationToken) {
    return res.status(400).json({ message: "invalid link" });
  }

  if (!user.isAccountVerified) {
    user.isAccountVerified = true;
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);
  user.password = hashedPassword;
  await user.save();
  await verficationToken.deleteOne();
  res.status(200).json({ message: "password reset successfully , pls login" });
});
