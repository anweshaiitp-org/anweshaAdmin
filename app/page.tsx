import { redirect } from "next/navigation";
import { getAuthCookie } from "@/auth";

export default async function Home() {
  const token = await getAuthCookie();
  
  if (token) {
    redirect("/admin");
  } else {
    redirect("/login");
  }
}
