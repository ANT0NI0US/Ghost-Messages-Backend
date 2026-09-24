import { find, findByIdAndUpdate } from "../../common/repository/index.js";
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
