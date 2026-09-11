import { UserModel } from "../../DB/model/index.js";
import {
  ConflictException,
  ForbiddenException,
} from "../../common/exceptions/index.js";
import { create, findOne } from "../../common/repository/db.repository.js";
import {
  compare,
  decrypt,
  encrypt,
  generateToken,
  hash,
} from "../../common/security/index.js";

export const signup = async (inputs) => {
  const { email, phone, password } = inputs;

  const existingEmail = await findOne({ model: UserModel, filter: { email } });
  if (existingEmail) throw ConflictException("Email already exist");

  const user = await create({
    model: UserModel,
    data: {
      ...inputs,
      password: await hash({ plainText: password }),
      phone: await encrypt(phone),
    },
  });

  return user;
};

export const login = async ({ email, password }) => {
  const account = await findOne({
    model: UserModel,
    filter: { email },
  });

  if (!account) throw ForbiddenException("Invalid email or password");

  const match = await compare(password, account.password);

  if (!match) throw ForbiddenException("Invalid email or password");

  account.phone = await decrypt(account.phone);

  const token = generateToken({
    payload: { id: account._id, email: account.email },
  });

  const { password: _, ...dataWithoutPassword } = account.toObject();

  return { ...dataWithoutPassword, token };
};
