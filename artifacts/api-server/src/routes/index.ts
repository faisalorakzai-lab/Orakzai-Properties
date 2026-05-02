import { Router, type IRouter } from "express";
import healthRouter from "./health";
import propertiesRouter from "./properties";
import projectsRouter from "./projects";
import investmentProjectsRouter from "./investment_projects";
import portfolioRouter from "./portfolio";
import tradingRouter from "./trading";
import walletRouter from "./wallet";

const router: IRouter = Router();

router.use(healthRouter);
router.use(propertiesRouter);
router.use(projectsRouter);
router.use(investmentProjectsRouter);
router.use(portfolioRouter);
router.use(tradingRouter);
router.use(walletRouter);

export default router;
