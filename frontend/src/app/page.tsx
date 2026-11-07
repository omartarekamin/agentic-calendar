import { AuthRouteBoundary } from "@/components/auth/auth-route";

export default function HomePage() {
  return <AuthRouteBoundary mode="redirect" />;
}
