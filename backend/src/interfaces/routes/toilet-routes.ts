import { Router } from "express";
import { ToiletController } from "@/interfaces/controllers/toilet-controller";

export const createToiletRoutes = (
    toiletController: ToiletController
): Router => {
    const router = Router();

    // GET /api/toilets/nearby?latitude=37.5665&longitude=126.9780&radius=1000&limit=10
    router.get("/nearby", (req, res) =>
        toiletController.getNearbyToilets(req, res)
    );

    // GET /api/toilets/:id
    router.get("/:id", (req, res) => toiletController.getToiletById(req, res));

    return router;
};
