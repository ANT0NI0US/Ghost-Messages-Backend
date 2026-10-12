import { exceptions, security, services } from "../../common/index.js";
import { models, queries } from "../../DB/index.js";

export const profile = async (user) => {
  user.phone = await security.decrypt(user.phone);

  return user;
};

export const allUsers = async (user) => {
  const users = await queries.find({
    model: models.UserModel,
    filter: { _id: { $ne: user._id } },
    select: "-password -phone",
  });
  return users;
};

export const updateUser = async (user, updatedData) => {
  if (updatedData.phone) {
    updatedData.phone = await security.encrypt(updatedData.phone);
  }
  const updatedUser = await queries.findByIdAndUpdate({
    model: models.UserModel,
    id: user._id,
    update: updatedData,
  });
  await services.del({ key: security.userBaseProfile({ userId: user._id }) });
  return updatedUser;
};

export const shareProfile = async ({ userId }) => {
  const user = await queries.findById({ model: models.UserModel, id: userId });

  if (!user) {
    throw exceptions.NotFoundException({ message: "error.invalidUser" });
  }

  return user;
};

export const profileImage = async (user, file) => {
  if (file) {
    user.image = file.finalPath;
    await user.save();
    await services.del({ key: security.userBaseProfile({ userId: user._id }) });
  }

  user.phone = await security.decrypt(user.phone);

  return user;
};
