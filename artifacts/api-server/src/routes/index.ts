import { Router, type IRouter } from "express";
import healthRouter from "./health";
import propertiesRouter from "./properties";
import projectsRouter from "./projects";
import investmentProjectsRouter from "./investment_projects";

const router: IRouter = Router();

router.use(healthRouter);
router.use(propertiesRouter);
router.use(projectsRouter);
router.use(investmentProjectsRouter);

export default router;
