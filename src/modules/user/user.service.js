import { NotFoundException } from "../../common/exceptions/error.exceptions.js";
import {
  find,
  findById,
  findByIdAndUpdate,
} from "../../common/repository/index.js";
import { UserModel } from "../../DB/model/index.js";

export const profile = async (user) => {
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
