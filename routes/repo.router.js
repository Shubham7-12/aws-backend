const express = require("express");
const repoController = require("../controllers/repoControllers");
 
const repoRouter = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const optionalAuthMiddleware = require("../middleware/optionalAuthMiddleware");

repoRouter.post("/repo/create",authMiddleware, repoController.createRepository);
repoRouter.get("/repo/all", repoController.getAllRepositories);
repoRouter.get("/repo/:id", optionalAuthMiddleware, repoController.fetchRepositoriesById);
repoRouter.get("/repo/name/:name", repoController.fetchRepositoriesByName);
repoRouter.get("/repo/user/:userID",  authMiddleware,repoController.fetchRepositoriesForCurrentUser);
repoRouter.put("/repo/update/:id",authMiddleware,repoController.updateRepositoryById);
repoRouter.delete("/repo/delete/:id",authMiddleware,repoController.deleteRepositoryById);
repoRouter.patch("/repo/toggle/:id",authMiddleware,repoController.toggleVisibilityById);

module.exports = repoRouter;
