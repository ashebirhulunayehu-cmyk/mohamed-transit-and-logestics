import { redirect } from "next/navigation";

export default function Home() {
  redirect("/en/auth/login");
  return null;
}
