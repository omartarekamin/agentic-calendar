import { authMiddleware } from "@descope/nextjs-sdk/server";
import { paths } from "@/lib/paths";

export default authMiddleware({
  privateRoutes: [paths.dashboard, paths.connectionTest],
  redirectUrl: paths.signIn,
  skipRefreshTokenValidation: true,
});

export const config = {
  matcher: ["/dashboard/:path*", "/connection-test/:path*"],
};
