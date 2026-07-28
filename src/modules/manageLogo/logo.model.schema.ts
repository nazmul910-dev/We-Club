import { model, Schema } from "mongoose";
import { ILogo } from "./logo.interface";


const logoSchema = new Schema<ILogo>(
    {
        logo: {
            type:String,
            required:true,
            trim: true
        },
        
    }
)

export const logo = model<ILogo>('logo', logoSchema);