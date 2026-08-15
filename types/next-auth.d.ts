import { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      role: string;
      anweshaId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    anweshaId?: string;
    accessToken: string;
  }

  
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    anweshaId?: string;
    accessToken?: string;
  }
}