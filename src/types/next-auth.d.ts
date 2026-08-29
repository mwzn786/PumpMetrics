import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/lib/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      stationId: number | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    stationId: number | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    stationId: number | null;
  }
}
