import { Router, Request, Response } from "express";
import { Project } from "../models/project.model";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { deleteFromCloudinary } from "../config/cloudinary";

const router = Router();

router.get("/", async (_: Request, res: Response): Promise<void> => {
  try {
    const projects = await Project.find().sort({ order: 1, createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

router.get("/featured", async (_: Request, res: Response): Promise<void> => {
  try {
    const projects = await Project.find({ featured: true }).sort({
      order: 1,
      createdAt: -1,
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

router.post(
  "/",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const project = new Project(req.body);
      await project.save();
      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  }
);

router.put(
  "/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  }
);

router.delete(
  "/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
      }

      if (project.imagePublicId) {
        await deleteFromCloudinary(project.imagePublicId);
      }

      await Project.findByIdAndDelete(req.params.id);
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  }
);

export default router;
