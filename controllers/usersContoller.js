const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const {
  cloudinaryRemoveImage,
  cloudinaryUploadImage,
  cloudinaryRemoveMultipleImages,
} = require("../utiities/cloudinary");
const path = require("path");
const fs = require("fs");
const {
  User,
  validateRegisterUser,
  validateLoginUser,
  validateUpdateUser,
} = require("../models/userModel");
const { Comment } = require("../models/commentModel");
const { Post } = require("../models/postModel");

/**..........................................................................
*@desc    Get All Users
*@route   //api/users/profile
*@method  GET
*@access  private (only admin)
............................................................................*/

module.exports.getAllUsers = asyncHandler(async (req, res) => {
  // i will put this user admin check in middle ware with verify token file
  //   if (!req.user.isAdmin) {
  //     return res.status(403).json({ message: "Not Allowed Only Admin" });
  //   }
  const users = await User.find().select("-password").populate("posts"); // geting posts inside user;
  res.status(200).json(users);
});
/**..........................................................................
*@desc    Get User Profile
*@route   api/users/profile/:id
*@method  GET
*@access  public 
............................................................................*/
module.exports.getUserProfileCtrl = asyncHandler(async (req, res) => {
  // i will put this user admin check in middle ware with verify token file
  //   if (!req.user.isAdmin) {
  //     return res.status(403).json({ message: "Not Allowed Only Admin" });
  //   }

  const user = await User.findById(req.params.id)
    .select("-password")
    .populate("posts"); // geting posts inside user
  if (!user) {
    return res.status(404).json({ message: "User Not Found" });
  }
  res.status(200).json(user);
});
/**..........................................................................
*@desc    Update User Profile
*@route   api/users/profile/:id
*@method  PUT
*@access  private(only user himself)
............................................................................*/
// update user profile
module.exports.updateUserProfileCtrl = asyncHandler(async (req, res) => {
  const { error } = validateUpdateUser(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
  }
  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        username: req.body.username,
        password: req.body.password,
        bio: req.body.bio,
      },
    },
    { new: true }
  )
    .select("-password")
    .populate("posts");
  res.status(200).json(updatedUser);
});
/**..........................................................................
*@desc    Get Users count Profile
*@route   api/users/count
*@method  GET
*@access  private (only admin)
............................................................................*/
// get users count
module.exports.getAllUsersCount = asyncHandler(async (req, res) => {
  // i will put this user admin check in middle ware with verify token file
  //   if (!req.user.isAdmin) {
  //     return res.status(403).json({ message: "Not Allowed Only Admin" });
  //   }
  const count = await User.countDocuments();
  res.status(200).json(count);
});
/**..........................................................................
*@desc    Upload Profile Photo
*@route   api/users/profile/profile-photo-upload
*@method  POST
*@access  private (only login user)
............................................................................*/
// profile photo upload
module.exports.profilePhotouploadCtrl = asyncHandler(async (req, res) => {
  // WE GONNA USE MULTER TO UPLOAD FILES THEN WE USE CLOUDINARY TO TAKE IT ONLINE ON OTHER SERVER AND REMOVE
  // FROM OUR SERVER COZ IF THERE ARE MANY IMAGES BETTER USING CLOUDINARY IMAGE FILE HERE STEPS
  // 1- validation
  // 2- get the path to image
  // 3- upload to cloudinary
  // 4- get the user from db
  // 5- delete the old profile photo if exist coz he updated it
  // 6- change the profile photo filed in the db
  // 7- send res to client
  // 8- remove image from the server from image file coz it will be on clouldinary
  // step 1 validation
  if (!req.file) {
    return res.status(400).json({ message: "No File Provided" });
  }
  // step 2 path
  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
  // step 3 upload to cloudinary
  const result = await cloudinaryUploadImage(imagePath);
  // step 4 get user from db
  const user = await User.findById(req.user.id); // user.id from extracting token
  // step 5 delete old profile photo if exist
  if (user.profilephoto.publicId !== null) {
    await cloudinaryRemoveImage(user.profilephoto.publicId);
  }
  // step 6 change the profile photo filed in the db
  user.profilephoto = {
    url: result.secure_url,
    publicId: result.public_id, // i need public id coz if needed to delete it in future
  };
  await user.save();
  // step 7 send res to client
  res.status(200).json({
    message: " Profile Photo Uploaded Successfully",
    profilephoto: { url: result.secure_url, publicId: result.public_id },
  });
  // step 8  remove image from the server from image file coz it will be on clouldinary
  fs.unlinkSync(imagePath);
});
/**..........................................................................
*@desc    Delete User Profile
*@route   api/users/profile/:id
*@method  DELETE
*@access  private (only user himself or admin)
............................................................................*/
// delete user profile admin can do it either or user himself
module.exports.deleteUserProfileCtrl = asyncHandler(async (req, res) => {
  // 1- get user from db and validation
  // 2- get all user posts from db
  // 3- get the public ids from posts
  // 4- delete all user images posts from cloudinary
  // 5- delete the profile picture from cloudinary
  // 6- delete user posts and comments
  // 7- delete the user him self
  // 8- send res to the client

  // step 1 get user from db and validation
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User Not Found" });
  }

  // step 2 get all user posts from db
  const posts = await Post.find({ user: user._id });
  // step 3 get the public ids from posts
  const publicids = posts?.map((post) => post.image.publicId);
  // step 4 delete all user images posts from cloudinary
  if (publicids?.length > 0) {
    await cloudinaryRemoveMultipleImages(publicids);
  }
  // step 5 delete the profile picture from cloudinary
  if (user.profilephoto.publicId !== null) {
    await cloudinaryRemoveImage(user.profilephoto.publicId);
  }
  // step 6 delete user posts and comments
  await Post.deleteMany({ user: user._id });
  await Comment.deleteMany({ user: user._id });
  // step 7 delete the user him self
  await User.findByIdAndDelete(req.params.id);

  // step 8 send res to the client
  res
    .status(200)
    .json({ message: "Your Profile Has Been Deleted Successfully" });
});
