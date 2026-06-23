import bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import config from "../../config";
import User from "../users/users.model.schema";
import { IUser } from "../users/user.interface";
import { ExistingUserError, InvalidCredentialsError } from "../../utility/errorResponses";

const SALT_ROUNDS = 10;

export async function createUser(data: Partial<IUser>) {

    console.log("Creating user with data:", data); // Debug log
  if (!data.name || !data.email || !data.password) {
    throw new Error("name, email and password are required");
  }

  const existing = await User.findOne({ email: data.email });
  if (existing) throw new ExistingUserError("User with this email already exists");

  const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);
  
  const user = await User.create({
    name: data.name,
    email: data.email,
    password: hashed,
    role: data.role || "USER",
  });
  // remove password before returning
  const obj = user.toObject();
  delete (obj as any).password;
  return obj;
// return null;
}

export async function loginUser(email: string, password: string) {
  const user = await User.findOne({ email });
  if (!user) throw new InvalidCredentialsError("Invalid credentials");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new InvalidCredentialsError("Invalid credentials");

  console.log(user);

  const payload = { id: user._id.toString(), email: user.email, role: user.role };
  const token = jwt.sign(
    payload as string | object | Buffer,
    config.JWT_SECRET as jwt.Secret,
    { expiresIn: config.JWT_EXPIRES_IN } as jwt.SignOptions
  );

  const u = user.toObject();
  delete (u as any).password;
  return { token };

}



export default { createUser, loginUser };
