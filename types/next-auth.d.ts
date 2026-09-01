import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "STUDENT" | "LECTURER" | "MANAGEMENT";
    } & DefaultSession["user"];
  }

  interface User {
    role: "STUDENT" | "LECTURER" | "MANAGEMENT";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "STUDENT" | "LECTURER" | "MANAGEMENT";
  }
}
