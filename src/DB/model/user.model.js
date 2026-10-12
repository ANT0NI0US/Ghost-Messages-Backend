import mongoose from "mongoose";
import { enums } from "../../common/index.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      minLength: [2, "validation.firstName.min"],
      maxLength: [30, "validation.firstName.max"],
      required: [true, "validation.firstName.required"],
    },
    lastName: {
      type: String,
      minLength: [2, "validation.lastName.min"],
      maxLength: [30, "validation.lastName.max"],
      required: [true, "validation.lastName.required"],
    },
    email: {
      type: String,
      required: [true, "validation.email.required"],
      trim: true,
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      required: [
        function () {
          return this.provider == enums.ProviderEnum.SYSTEM;
        },
        "validation.password.required",
      ],
    },
    phone: String,
    DOB: Date,
    confirmEmail: Date,
    image: String,
    coverImage: [String],
    gender: {
      type: Number,
      enum: {
        values: Object.values(enums.GenderEnum),
        message: "validation.gender.invalid",
      },
      default: enums.GenderEnum.MALE,
    },
    role: {
      type: Number,
      enum: {
        values: Object.values(enums.RoleEnum),
        message: "validation.role.invalid",
      },
      default: enums.RoleEnum.USER,
    },
    provider: {
      type: Number,
      enum: {
        values: Object.values(enums.ProviderEnum),
        message: "validation.provider.invalid",
      },
      default: enums.ProviderEnum.SYSTEM,
    },
    changeCredentialsTime: Date,
    twoStepVerification: Boolean,
    deletedAt: Date,
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    strict: true,
    autoIndex: true,
    strictQuery: true,
    optimisticConcurrency: true,
  },
);

userSchema
  .virtual("username")
  .set(function (value) {
    const [firstName, lastName] = value.split(" ") || [];
    this.set({ firstName, lastName });
  })
  .get(function () {
    return `${this.firstName} ${this.lastName}`;
  });

export const UserModel =
  mongoose.models.User || mongoose.model("User", userSchema);
