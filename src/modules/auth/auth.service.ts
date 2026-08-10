import bcrypt from "bcryptjs";
import { JwtPayload, SignOptions } from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../../lib/prisma";
import { ILoginUser } from "./auth.interface";
import config from "../../config";
import { jwtUtils } from "../../utils/jwt";
import { AppError } from "../../utils/AppError";
import httpStatus from "http-status";

const googleClient = new OAuth2Client(config.google_client_id);

const loginUser = async (payload: ILoginUser) => {
  const { email, password } = payload;

  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
  });

  if (user.status === "BANNED") {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account has been banned. Please contact support.",
    );
  }

  if (!user.password) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This account uses Google login. Please sign in with Google.",
    );
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);

  if (!isPasswordMatched) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Password is incorrect");
  }

  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return { accessToken, refreshToken };
};

const googleLogin = async (credential: string) => {
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: config.google_client_id,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid Google token");
  }

  const { email, name, sub: googleId } = payload;

  let user = await prisma.user.findFirst({
    where: { OR: [{ email }, { googleId }] },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: name || "Google User",
        email,
        googleId,
        role: "TENANT",
        profiles: { create: { phone: null } },
      },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId },
    });
  }

  if (user.status === "BANNED") {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account has been banned. Please contact support.",
    );
  }

  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return { accessToken, refreshToken };
};

const refreshToken = async (refreshToken: string) => {
  const verifiedRefreshToken = jwtUtils.verifyToken(
    refreshToken,
    config.jwt_refresh_secret,
  );
  if (!verifiedRefreshToken.success) {
    throw new AppError(httpStatus.UNAUTHORIZED, verifiedRefreshToken.error!);
  }
  const { id } = verifiedRefreshToken.data as JwtPayload;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id },
  });
  if (user.status === "BANNED") {
    throw new AppError(httpStatus.FORBIDDEN, "Your account has been banned. Please contact support.");
  }
  const JwtPayload = {
    id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    JwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );
  return { accessToken };
};

export const authService = {
  loginUser,
  googleLogin,
  refreshToken,
};