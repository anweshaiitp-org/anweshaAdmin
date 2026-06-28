import NextAuth, { DefaultSession }  from "next-auth";
import Credentials from "next-auth/providers/credentials";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string; 
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers:[
        Credentials({
            name:"Credentials",
            credentials:{
                email:{label:"Email",type:"string"},
                password:{label:"Password",type:"password"}
            },
            async authorize(credentials){
                if(!credentials?.email || !credentials?.password){
                    return null;
                }
                const email=credentials.email as string;
                const password=credentials.password as string;
                //fetching users from database here and then searching for email in the users array and matching password for authentication
                //use bcrypt.compare for validating password
                const user = {
                    id: "admin-123",
                    email: "admin@example.com",
                    name: "Admin User",
                    passwordHash: "123", 
                    role: "Admin"
                };
                if(!user){
                    return null;
                }
                if (email !== user.email) {
                    return null; 
                }
                const isValidPassword=password==user.passwordHash;//use compare for validating password here
                if(!isValidPassword){
                    return null;
                }
                return {
                    id:user.id,
                    name:user.name,
                    email:user.email,
                    role:user.role
                }
            }
        })
    ],
    callbacks:{
        async jwt({token,user}){
            if(user){
                token.id=user.id;
                token.role=(user as any).role;
            }
            return token;
        },
        async session({session,token}){
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        }
    },
    pages:{
        signIn:"/login",
    },
    session:{
        strategy:"jwt",
        maxAge: 60*60,
    },
    secret: process.env.NEXTAUTH_SECRET,
});
