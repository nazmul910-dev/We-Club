import jwt from 'jsonwebtoken'

export const createToken = <T extends object>(
  jwtPayload: T,
  secret: string,
  expiresInSeconds: number
): string => {
  return jwt.sign(jwtPayload as jwt.JwtPayload, secret, { expiresIn: expiresInSeconds });
}

export const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret)
}