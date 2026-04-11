import { auth } from "@/auth";
import NavHeaderClient from "./NavHeaderClient";

export default async function NavHeader() {
  const session = await auth();
  return <NavHeaderClient session={session} />;
}
