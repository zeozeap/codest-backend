import { Router, Response } from "express";
import fs from "fs";
import { upload } from "../middleware/upload.middleware";
import { uploadToCloudinary } from "../config/cloudinary";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

router.post(
  "/image",
  authMiddleware,
  upload.single("image"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ message: "No file uploaded" });
        return;
      }

      const result = await uploadToCloudinary(req.file.path, "codest/projects");

      fs.unlinkSync(req.file.path);

      res.json({
        url: result.url,
        publicId: result.publicId,
      });
    } catch (error) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: "Upload failed", error });
    }
  }
);

export default router;
