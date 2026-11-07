import { AuthRoute } from "@/components/auth/auth-route";

export default function DashboardPage() {
  return <AuthRoute mode="authenticated" />;
}
