const cloudinary = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_CLOUD_API_KEY,
  api_secret: process.env.CLOUDINARY_CLOUD_API_SECRET,
});

// cloudinary upload image
const cloudinaryUploadImage = async (fileToUpload) => {
  try {
    const data = await cloudinary.uploader.upload(fileToUpload, {
      resource_type: "auto",
    });
    return data;
  } catch (error) {
    console.log(error);
    throw new Error("internal server error (cloudinary)");
  }
};
// cloudinary remove image if exist coz he updates his profile photo and remove from cloudinary website
const cloudinaryRemoveImage = async (imagePublicId) => {
  try {
    const result = await cloudinary.uploader.destroy(imagePublicId);
    return result;
  } catch (error) {
    console.log(error);
    throw new Error("internal server error (cloudinary)");
  }
};
// clouadinary remove multiple  images
const cloudinaryRemoveMultipleImages = async (publicids) => {
  try {
    const result = await cloudinary.v2.api.delete_resources(publicids);
    return result;
  } catch (error) {
    console.log(error);
    throw new Error("internal server error (cloudinary)");
  }
};
module.exports = {
  cloudinaryRemoveImage,
  cloudinaryUploadImage,
  cloudinaryRemoveMultipleImages,
};
