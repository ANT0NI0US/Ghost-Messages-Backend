import { exceptions, security, services } from "../../common/index.js";
import { models, queries } from "../../DB/index.js";

export const profile = async (user) => {
  user.phone = await security.decrypt(user.phone);

  return user;
};

export const allUsers = async (user, { page, limit } = {}) => {
  const data = await queries.paginate({
    model: models.UserModel,
    filter: { _id: { $ne: user._id } },
    options: {
      sort: { createdAt: -1 },
    },
    select: "-password -phone",
    page,
    limit,
  });

  return data;
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
    user.image = file.path;
    // we use validateModifiedOnly: true cause we remove password from back in all cases and we don't want to validate it.
    await user.save({ validateModifiedOnly: true });
    await services.del({ key: security.userBaseProfile({ userId: user._id }) });
  }

  user.phone = await security.decrypt(user.phone);

  return user;
};
