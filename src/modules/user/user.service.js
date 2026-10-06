import { NotFoundException } from "../../common/exceptions/error.exceptions.js";
import {
  find,
  findById,
  findByIdAndUpdate,
} from "../../common/repository/index.js";
import { decrypt, encrypt } from "../../common/security/index.js";
import { UserModel } from "../../DB/model/index.js";

export const profile = async (user) => {
  user.phone = await decrypt(user.phone);

  return user;
};

export const allUsers = async (user) => {
  const users = await find({
    model: UserModel,
    filter: { _id: { $ne: user._id } },
    select: "-password -phone",
  });
  return users;
};

export const updateUser = async (user, updatedData) => {
  if (updatedData.phone) {
    updatedData.phone = await encrypt(updatedData.phone);
  }
  const updatedUser = await findByIdAndUpdate({
    model: UserModel,
    id: user._id,
    update: updatedData,
  });
  return updatedUser;
};

export const shareProfile = async ({ userId }) => {
  const user = await findById({ model: UserModel, id: userId });

  if (!user) {
    throw NotFoundException({ message: "Invalid shared account" });
  }

  return user;
};

export const profileImage = async (user, file) => {
  if (file) {
    user.image = file.finalPath;
    await user.save();
  }

  user.phone = await decrypt(user.phone);

  return user;
};
