import {z} from 'zod'

const changePasswordValidationSchema = z.object({
    body:z.object({
        oldPassword:z.string().min(1,{message:"Old password is required"}),
        newPassword:z.string().min(1,{message:"New password is required"}),
    })
})


const refreshTokenValidationSchema = z.object({
  cookies:z.object({
    refreshToken:z.string().min(1,{message:"Refresh Token is required"})
  })

})


const forgetPasswordValidationSchema = z.object({
  body: z.object({
    email: z.email({ message: "Valid email is required" })
  })
})

const resetPasswordValidationSchema = z.object({
  body:z.object({
    newPassword: z.string().min(1,{message:"Password is required"})
  })
})

export const AuthValidations = {
    changePasswordValidationSchema,
    refreshTokenValidationSchema,
    forgetPasswordValidationSchema,
    resetPasswordValidationSchema
}