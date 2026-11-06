import {
  enums,
  exceptions,
  fileUpload,
  objectId,
  security,
  services,
} from "../../common/index.js";
import { models, queries } from "../../DB/index.js";

export const profile = async (user) => {
  if (user.phone) {
    user.phone = await security.decrypt(user.phone);
  }

  return user.toJSON();
};

export const allUsers = async ({ page, limit, type } = {}) => {
  let filter = {};
  switch (type) {
    case enums.UsersByAccountStatusEnum.ARCHIVE:
      filter = {
        paranoid: false,
        status: enums.AccountStatusEnum.ARCHIVE,
      };
      break;

    case enums.UsersByAccountStatusEnum.ACTIVE:
      filter = { status: enums.AccountStatusEnum.ACTIVE };
      break;

    default:
      filter = { paranoid: false };
      break;
  }
  const data = await queries.paginate({
    model: models.UserModel,
    filter: {
      role: { $ne: enums.RoleEnum.ADMIN },
      ...filter,
    },
    options: {
      sort: { createdAt: -1 },
    },
    select: "-password -phone",
    page,
    limit,
  });

  return {
    ...data,
    docs: data.docs.map((doc) => doc.toJSON()),
  };
};

export const updateUser = async (user, updatedData) => {
  if (updatedData.phone) {
    updatedData.phone = await security.encrypt(updatedData.phone);
  }
  const updatedUser = await queries.findByIdAndUpdate({
    model: models.UserModel,
    id: user._id,
    update: updatedData,
    options: { projection: "-password" },
  });
  await services.del({ key: security.userBaseProfile({ userId: user._id }) });

  if (updatedUser?.phone) {
    updatedUser.phone = await security.decrypt(updatedUser.phone);
  }
  return updatedUser?.toJSON();
};

export const shareProfile = async ({ userId }) => {
  const user = await queries.findById({
    model: models.UserModel,
    id: userId,
    select: "firstName lastName image coverImage gender",
  });

  if (!user) {
    throw exceptions.NotFoundException({ message: "error.invalidUser" });
  }

  return user.toJSON();
};

export const profileImage = async (user, file) => {
  // keep the old image before overwriting it
  const oldImage = user.image;

  user.image = file.path;
  // we use validateModifiedOnly: true cause we remove password from back in all cases and we don't want to validate it.
  await user.save({ validateModifiedOnly: true });
  await services.del({ key: security.userBaseProfile({ userId: user._id }) });

  // remove the old image only after the new one is saved
  if (oldImage) {
    await fileUpload.deleteLocalFile({ url: oldImage });
  }

  return user.image;
};

export const updateStatus = async (admin, { userId }, { status }) => {
  if (admin._id.equals(userId)) {
    throw exceptions.BadRequestException({
      message: "error.cannotChangeOwnStatus",
    });
  }

  const targetUser = await queries.findOne({
    model: models.UserModel,
    filter: { _id: objectId.toObjectId({ id: userId }), paranoid: false },
    select: "role status",
  });

  if (!targetUser) {
    throw exceptions.NotFoundException({ message: "error.invalidUser" });
  }

  if (targetUser.role == enums.RoleEnum.ADMIN) {
    throw exceptions.ForbiddenException({ message: "error.forbidden" });
  }

  if (targetUser.status == status) {
    throw exceptions.ConflictException({ message: "error.statusAlreadySet" });
  }

  const updatedUser = await queries.findByIdAndUpdate({
    model: models.UserModel,
    id: targetUser._id,
    update: {
      status,
      ...(status == enums.AccountStatusEnum.ARCHIVE
        ? { changeCredentialsTime: new Date() }
        : {}),
    },
    options: { projection: "-password" },
  });

  if (!updatedUser) {
    throw exceptions.ConflictException({ message: "error.statusAlreadySet" });
  }

  await services.del({
    key: security.userBaseProfile({ userId: updatedUser._id }),
  });

  return {
    userId: updatedUser._id,
    status: updatedUser.status,
    changeStatusAt: updatedUser.changeStatusAt,
  };
};

export const deleteUser = async (admin, { userId }) => {
  if (admin._id.equals(userId)) {
    throw exceptions.BadRequestException({
      message: "error.cannotDeleteOwnAccount",
    });
  }

  const targetUser = await queries.findOne({
    model: models.UserModel,
    filter: { _id: objectId.toObjectId({ id: userId }), paranoid: false },
    select: "role status email image coverImage",
  });

  if (!targetUser) {
    throw exceptions.NotFoundException({ message: "error.invalidUser" });
  }

  if (targetUser.role == enums.RoleEnum.ADMIN) {
    throw exceptions.ForbiddenException({ message: "error.forbidden" });
  }

  if (targetUser.status != enums.AccountStatusEnum.ARCHIVE) {
    throw exceptions.ConflictException({
      message: "error.archiveBeforeDelete",
    });
  }

  const deletedUser = await queries.findByIdAndDelete({
    model: models.UserModel,
    id: targetUser._id,
  });

  if (!deletedUser) {
    throw exceptions.ConflictException({
      message: "error.archiveBeforeDelete",
    });
  }

  const [userIdKeys, userEmailKeys] = await Promise.all([
    services.keys({
      prefix: `User::${targetUser._id.toString()}::`,
    }),
    services.keys({ prefix: `User::${targetUser.email}::` }),
  ]);

  await services.del({
    key: [
      ...new Set([
        ...userIdKeys,
        ...userEmailKeys,
        security.userBaseProfile({ userId: targetUser._id }),
      ]),
    ],
  });

  await Promise.all(
    [targetUser.image, ...(targetUser.coverImage ?? [])]
      .filter((url) => Boolean(url))
      .map((url) => fileUpload.deleteLocalFile({ url })),
  );

  return;
};
