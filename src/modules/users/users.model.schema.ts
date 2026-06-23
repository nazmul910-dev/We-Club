import mongoose from "mongoose";
import { IUser } from "./user.interface";

const userSchema  = new mongoose.Schema<IUser>({
    name: {
        type: String, 
      }, 
    email: {
        type: String,
        unique: true, 
      },
    password: {
        type: String, 
      },
    role: {
        type: String,
        enum: ['ADMIN', 'ASSOCIATES', 'PARTNERS', 'USER'],
        default: 'USER'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model("User", userSchema);

export default User;