import "next-auth";

declare module "next-auth" {
  interface User {
    alias?: string;
    role?: string;
  }

  interface Session {
    user: {
      id: string;
      alias?: string;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    alias?: string;
    role?: string;
  }
}
