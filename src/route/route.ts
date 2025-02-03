import { Hono } from "hono";
import { protectionMiddleware } from "../middleware/protection.middleware.js";
import auth from "./auth/auth.route.js";
import dashboard from "./dashboard/dashboard.route.js";
import deposit from "./deposit/deposit.route.js";
import health from "./health/health.route.js";
import leaderboard from "./leaderboard/leaderboard.route.js";
import merchant from "./merchant/merchant.route.js";
import options from "./options/options.route.js";
import packages from "./package/package.route.js";
import referral from "./referral/referral.route.js";
import transaction from "./transaction/transaction.route.js";
import user from "./user/user.route.js";
import withdraw from "./withdraw/withdraw.route.js";

const app = new Hono();

//auth route
app.route("/auth", auth);

//health route
app.route("/health", health);

//deposit route
app.use("/deposit/*", protectionMiddleware);
app.route("/deposit", deposit);

//user route
app.use("/user/*", protectionMiddleware);
app.route("/user", user);

//transaction route
app.use("/transaction/*", protectionMiddleware);
app.route("/transaction", transaction);

//referral route
app.use("/referral/*", protectionMiddleware);
app.route("/referral", referral);

//package route
app.use("/package/*", protectionMiddleware);
app.route("/package", packages);

//merchant route
app.use("/merchant/*", protectionMiddleware);
app.route("/merchant", merchant);

//withdraw route
app.use("/withdraw/*", protectionMiddleware);
app.route("/withdraw", withdraw);

//dashboard route
app.use("/dashboard/*", protectionMiddleware);
app.route("/dashboard", dashboard);

//leaderboard route
app.use("/leaderboard/*", protectionMiddleware);
app.route("/leaderboard", leaderboard);

//options route
app.use("/options/*", protectionMiddleware);
app.route("/options", options);

app.get("/", (c) => c.text("This is the api endpoint"));

export default app;
