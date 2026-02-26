import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in to FDE World",
  description: "Sign in to your FDE World account to access your personalised job feed, saved roles and candidate profile.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
