import { z } from "zod";

const ORDER_STATUS_VALUES = ["pending", "confirmed", "shipped", "delivered"];

export const adminLoginSchema = z
  .object({
    email: z.string().email().max(254),
    password: z.string().min(8).max(120),
  })
  .strict();

export const updateAdminOrderStatusSchema = z
  .object({
    status: z.enum(ORDER_STATUS_VALUES),
  })
  .strict();
