const mongoose = require("mongoose");
const joi = require("joi");
const jwt = require("jsonwebtoken");
const passwordComplixity = require("joi-password-complexity");
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlenth: 2,
      maxlenth: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      minlenth: 5,
      maxlenth: 100,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlenth: 8,
    },
    profilephoto: {
      type: Object,
      default: {
        url: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png",
        publicId: null,
      },
    },
    bio: {
      type: String,
    },
    // bio:String // if just one
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isAccountVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // will add to schema updated at and created at after isAccountVerified filed
    toJSON: { virtuals: true }, // this to manage mongoose to make virtual
    toObject: { virtuals: true }, // this to manage mongoose to make virtual
  }
);
// populate post that belong to user virtual() method will make relation between post model and user model
// user field this will add posts filed in model if needed but in real as u see its not in model right now u cant see posts field
userSchema.virtual("posts", {
  // first parameter "posts" is field name
  ref: "Post", // ref to Post model
  foreignField: "user", // external field should be in Post model as we see theres user field in post model so this data will be inside user in res
  localField: "_id", // this local id from this schema mongodb automatically added id for each user
});
// generate token jwt.sign(object param including what want in token , private key , expiration in obj)
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, isAdmin: this.isAdmin },
    process.env.JWT_SECRETKEY
  );
  // return jwt.sign({id:this._id , isAdmin:this.isAdmin},"PrivateKey",{
  //   expiresIn:"30d"
  // })
};
const User = mongoose.model("User", userSchema);
// validate rgister
function validateRegisterUser(obj) {
  const schema = joi.object({
    username: joi.string().trim().min(2).max(100).required(),
    email: joi.string().trim().min(5).max(100).required().email(),
    // password: joi.string().trim().min(8).required(), // now will use password complixity for strong password
    password: passwordComplixity().required(),
  });
  return schema.validate(obj);
}
// validate login
function validateLoginUser(obj) {
  const schema = joi.object({
    email: joi.string().trim().min(5).max(100).required().email(),
    password: joi.string().trim().min(8).required(),
  });
  return schema.validate(obj);
}
// validate update user
function validateUpdateUser(obj) {
  const schema = joi.object({
    username: joi.string().trim().min(2).max(100),
    // password: joi.string().trim().min(8), // now will use password complixity for strong password
    password: passwordComplixity(),
    bio: joi.string(),
  });
  return schema.validate(obj);
}
// validate Email (for forgot password)
function validateEmail(obj) {
  const schema = joi.object({
    email: joi.string().trim().min(5).max(100).required().email(),
  });
  return schema.validate(obj);
}
// validate new password (for forgot password)
function validateNewPassword(obj) {
  const schema = joi.object({
    // password: joi.string().trim().min(8).required(), // now will use password complixity for strong password
    password: passwordComplixity().required(),
  });
  return schema.validate(obj);
}
module.exports = {
  User,
  validateRegisterUser,
  validateLoginUser,
  validateUpdateUser,
  validateEmail,
  validateNewPassword,
};
