export const removeUndefined = <T extends Record<string, unknown>>(obj: T): { 
  [K in keyof T as T[K] extends undefined ? never : K]: T[K] 
} => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as any;
};