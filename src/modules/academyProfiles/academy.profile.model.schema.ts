import { Schema, model } from "mongoose";
import {
  IAcademyProfile
} from "./academy.profile.interface";



const AcademyProfileSchema =
new Schema<IAcademyProfile>(
{

user:{

type:Schema.Types.ObjectId,

ref:"User",

required:true,

unique:true,

index:true

},



mentor:{

type:Schema.Types.ObjectId,

ref:"User",

},



currentPillar:{

type:Schema.Types.ObjectId,

ref:"ChallengePillar",

},



academyName:{

type:String,

trim:true,

maxlength:100

},



bio:{

type:String,

trim:true,

maxlength:1000

},



experienceLevel:{

type:String,

enum:[
"beginner",
"intermediate",
"advanced"
]

},



goals:[

{

type:String,

trim:true

}

],



totalPoints:{

type:Number,

default:0,

min:0

},



currentStreak:{

type:Number,

default:0,

min:0

},



longestStreak:{

type:Number,

default:0,

min:0

},



notificationPreferences:{


email:{

type:Boolean,

default:true

},


push:{

type:Boolean,

default:true

},


sms:{

type:Boolean,

default:false

}



}


},

{

timestamps:true

}

);



export const AcademyProfile =
model<IAcademyProfile>(
"AcademyProfile",
AcademyProfileSchema
);