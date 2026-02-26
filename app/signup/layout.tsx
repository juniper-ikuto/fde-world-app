import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join FDE World — Free access to 1,600+ FDE & SE roles",
  description:
    "Join FDE World for free. Get a personalised feed of Forward Deployed Engineer, Solutions Engineer and Pre-Sales roles updated daily. 60 seconds to sign up.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
