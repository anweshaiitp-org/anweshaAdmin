import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { CredentialsSignin } from "next-auth";
import type { LoginResponse } from "@/types/api";

const NEXTAUTH_URL = process.env.NEXTAUTH_URL;

if (!NEXTAUTH_URL) {
  throw new Error("NEXTAUTH_URL is not defined");
}


class LoginError extends CredentialsSignin {
  constructor(code: string) {
    super();
    this.code = code;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new LoginError("INVALID_CREDENTIALS");
        }

        // --- DEVELOPMENT MOCK LOGIN ---
        if (process.env.NODE_ENV === "development" && credentials.password === "test") {
          if (credentials.email === "admin@test.com") {
            return {
              id: "mock-admin-id",
              name: "Test Admin",
              email: "admin@test.com",
              role: "ADMIN",
              anweshaId: "ANW-ADMIN",
              accessToken: "mock-admin-token",
            };
          }
          if (credentials.email === "superadmin@test.com") {
            return {
              id: "mock-super-id",
              name: "Test Super Admin",
              email: "superadmin@test.com",
              role: "SUPER_ADMIN",
              anweshaId: "ANW-SUPER",
              accessToken: "mock-super-token",
            };
          }
        }
        // ------------------------------

        let response: Response;

        try {
          response = await fetch(`${NEXTAUTH_URL}/api/admin/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email_id: credentials.email,
              password: credentials.password,
            }),
          });
        } catch (error) {
          console.error("Failed to reach authentication server:", error);
          throw new LoginError("SERVER_UNAVAILABLE");
        }

        let data: LoginResponse;

        try {
          data = await response.json();
          console.log(data);
        } catch (error) {
          console.error("Invalid backend response:", error);
          throw new LoginError("UNKNOWN_ERROR");
        }

        if (!response.ok || !data.success || !data.user || !data.token) {
          throw new LoginError(data.code ?? "UNKNOWN_ERROR");
        }

        return {
          id: data.user.user_id,
          name: data.user.full_name,
          email: data.user.email_id,
          role: data.user.role,
          anweshaId: data.user.anwesha_id,
          accessToken: data.token,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.anweshaId = user.anweshaId;
        token.accessToken = user.accessToken;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.anweshaId = token.anweshaId as string;
      }

      session.accessToken = token.accessToken as string;

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 48, // 48 hours
  },

  secret: process.env.NEXTAUTH_SECRET,

  trustHost: true,
});