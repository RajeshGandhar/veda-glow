import { Router } from "express";
import lookupPincode from "../controllers/pincode.controller.js";

const router = Router();

router.get("/:pincode", lookupPincode);

export default router;
