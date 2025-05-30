const mongoose = require("mongoose");
// verification token schema
const verificationTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
// verification token model
const VerificationToken = mongoose.model(
  "VerificationToken",
  verificationTokenSchema
);

module.exports = VerificationToken;
