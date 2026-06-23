
import { Types } from "mongoose";


type Roles  = 'ADMIN' | 'ASSOCIATES' | 'PARTNERS' | 'USER' | "AMBASSADOR" | "MANAGER"  ;

interface IUser {
    id: string;
    name: string;
    email: string;
    password: string;
    role: Roles;
    createdAt: Date;
}

export type { IUser, Roles };