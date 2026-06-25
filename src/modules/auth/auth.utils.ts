import jwt from 'jsonwebtoken'

export const createToken = (
  jwtPayload:{userId: string,role:string},
  secret:string,
  expiresInSeconds:number
) =>{
  return jwt.sign(jwtPayload,secret,{expiresIn:expiresInSeconds})
}

export const verifyToken = (token:string, secret:string) =>{
  return jwt.verify(token,secret)
}