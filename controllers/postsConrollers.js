const fs = require("fs");
const path = require("path");
const asyncHandler = require("express-async-handler");
const {
  Post,
  validateCreatePost,
  validateUpdatePost,
} = require("../models/postModel");
const {
  cloudinaryUploadImage,
  cloudinaryRemoveImage,
} = require("../utiities/cloudinary");
const { Comment } = require("../models/commentModel");

// create posts
module.exports.createPostCtrl = asyncHandler(async (req, res) => {
  // 1- validation for image
  // 2- validation for data
  // 3- upload photo
  // 4- create new post and save in db
  // 5- send res to the client
  // 6- remove image from the server (image folder coz it will be on cloudinary website)
  // step 1 validation for image
  if (!req.file) {
    return res.status(400).json({ message: "No Image Provided" });
  }
  // step 2 validation for data
  const { error } = validateCreatePost(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  // step 3 upload photo

  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
  const result = await cloudinaryUploadImage(imagePath);
  // step 4 create new post and save in db
  // 2 methods to cretae new post
  // first here you need post.save()
  //   const post = new Post({
  //     title:req.body.title
  //   })
  //   await post.save()
  // seconde here you dont need post.save() coz it will be auto saved
  const post = await Post.create({
    title: req.body.title,
    description: req.body.description,
    category: req.body.category,
    user: req.user.id,
    image: {
      url: result.secure_url,
      publicId: result.public_id,
    },
  });

  // step 5 send res to the client
  res.status(201).json(post);
  //  step 6 remove image from the server (image folder coz it will be on cloudinary website)
  // step 1 validation for image
  fs.unlinkSync(imagePath);
});
// get all posts
module.exports.getAllPostsCtrl = asyncHandler(async (req, res) => {
  const POST_PER_PAGE = 3;
  const { pageNumber, category } = req.query;
  let posts;
  if (pageNumber) {
    posts = await Post.find()
      .skip((pageNumber - 1) * POST_PER_PAGE)
      .limit(POST_PER_PAGE)
      .sort({ createdAt: -1 })
      .populate("user", ["-password"])
      .populate("comments")
      .select("-__v"); //populate("user") taking id from post model user field
    // will get user information like email password from user collection
  } else if (category) {
    posts = await Post.find({ category })
      .sort({ createdAt: -1 }) // will sort data start with new data according createdAt
      .populate("user", ["-password"])
      .populate("comments")
      .select("-__v"); //populate("user") taking id from post model user field
    // will get user information like email password from user collection
  } else {
    posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("user", ["-password"])
      .populate("comments")
      .select("-__v"); //populate("user") taking id from post model user field
    // will get user information like email password from user collection
  }
  res.status(200).json(posts);
});
// get singlle post
module.exports.getSinglePostsCtrl = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate("user", ["-password"])
    .populate("comments");
  if (!post) {
    return res.status(404).json({ message: "Post Not Found" });
  }
  res.status(200).json(post);
});
// get post count
module.exports.getPostsCountCtrl = asyncHandler(async (req, res) => {
  const count = await Post.countDocuments();
  res.status(200).json(count);
});
// delete post
module.exports.deletePostsCtrl = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "Post Not Found" });
  }
  if (req.user.isAdmin || req.user.id == post.user.toString()) {
    await Post.findByIdAndDelete(req.params.id);
    await cloudinaryRemoveImage(post.image.publicId);
    //  delete post comments
    await Comment.deleteMany({ postId: post._id });

    res.status(200).json({
      message: "Post Has Been Deleted Successfully!",
      postId: post._id,
    });
  } else {
    res.status(403).json({ message: "Access Denied Forbedin!" });
  }
});
/**..........................................................................
*@desc    Update Post
*@route   api/posts/:id
*@method  PUT
*@access  private (only owner of the post)
............................................................................*/
module.exports.updatePostCtrl = asyncHandler(async (req, res) => {
  // 1- validation
  // 2- check if post in db
  // 3- check if the post belongs to the logged in user
  // 4- update post
  // send res to client
  const { error } = validateUpdatePost(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "Post Not Found!" });
  }
  if (req.user.id !== post.user.toString()) {
    return res
      .status(403)
      .json({ message: "Access Denied , Your Are Not Allowed" });
  }
  const updatedPost = await Post.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
      },
    },
    { new: true }
  )
    .populate("user", ["-password"])
    .populate("comments");
  res.status(200).json(updatedPost);
});
/**..........................................................................
*@desc    Update Post Image
*@route   api/posts/update-image/:id
*@method  PUT
*@access  private (only owner of the post)
............................................................................*/
module.exports.updatePostImageCtrl = asyncHandler(async (req, res) => {
  // 1- validation
  // 2- check if post in db
  // 3- check if the post belongs to the logged in user
  // 4- update post image first remove old image from cloudinary and upload new
  // 5- remove image from server
  // 6- send res to client

  if (!req.file) {
    return res.status(400).json({ message: "Required Image" });
  }
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "Post Not Found!" });
  }
  if (req.user.id !== post.user.toString()) {
    return res
      .status(403)
      .json({ message: "Access Denied , Your Are Not Allowed" });
  }
  await cloudinaryRemoveImage(post.image.publicId);
  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
  const result = await cloudinaryUploadImage(imagePath);

  const updatedPost = await Post.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        image: {
          url: result.secure_url,
          publicId: result.public_id,
        },
      },
    },
    { new: true }
  );
  fs.unlinkSync(imagePath);
  res.status(200).json(updatedPost);
});
/**...............................................
 *@desc    Toggle Like
 *@route   api/posts/like/:id
 *@method  PUT
 *@access  private (only Lgged in users)
 .................................................*/
module.exports.toggleLikeCtrl = asyncHandler(async (req, res) => {
  const loggedInUser = req.user.id;
  const { id: postId } = req.params;
  let post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({ message: "Post Not Found" });
  }
  const isPostAlreadyLiked = post.likes.find(
    (user) => user.toString() === loggedInUser
  );
  if (isPostAlreadyLiked) {
    post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: {
          // remove
          likes: loggedInUser,
        },
      },
      { new: true }
    );
  } else {
    post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: {
          // add
          likes: loggedInUser,
        },
      },
      { new: true }
    );
  }
  res.status(200).json(post);
});
