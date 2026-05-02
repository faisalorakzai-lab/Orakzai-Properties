import { Router, type IRouter } from "express";
import healthRouter from "./health";
import propertiesRouter from "./properties";
import projectsRouter from "./projects";

const router: IRouter = Router();

router.use(healthRouter);
router.use(propertiesRouter);
router.use(projectsRouter);

export default router;
