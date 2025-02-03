import { Hono } from "hono";
import {
  depositHistoryPostController,
  depositListPostController,
  depositPostController,
  depositPutController,
  depositReferencePostController,
} from "./deposit.controller.js";
import {
  depositHistoryPostMiddleware,
  depositListPostMiddleware,
  depositMiddleware,
  depositPutMiddleware,
  depositReferenceMiddleware,
} from "./deposit.middleware.js";

const deposit = new Hono();

deposit.post("/", depositMiddleware, depositPostController);

deposit.post(
  "/reference",
  depositReferenceMiddleware,
  depositReferencePostController
);

deposit.post(
  "/history",
  depositHistoryPostMiddleware,
  depositHistoryPostController
);

deposit.put("/:id", depositPutMiddleware, depositPutController);

deposit.post("/list", depositListPostMiddleware, depositListPostController);

export default deposit;
