import { findByIdAndUpdate } from "../../common/repository/index.js";
import { UserModel } from "../../DB/model/index.js";

export const profile = async (user) => {
  return user;
};

export const updateUser = async (user, updatedData) => {
  const updatedUser = await findByIdAndUpdate({
    model: UserModel,
    id: user._id,
    update: updatedData,
  });
  return updatedUser;
};
