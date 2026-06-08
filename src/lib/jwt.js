import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

// ✅ لو JWT_SECRET مش موجود في الـ env — وقف التطبيق فوراً
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET غير موجود في ملف .env");
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
