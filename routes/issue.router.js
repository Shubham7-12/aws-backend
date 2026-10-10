const express = require("express");
const issueController = require("../controllers/issueController");
const authMiddleware = require("../middleware/authMiddleware");
const optionalAuthMiddleware = require("../middleware/optionalAuthMiddleware");
 
const issueRouter = express.Router();

issueRouter.post(
    "/issue/create/:id",
    authMiddleware,
    issueController.createIssue
);
issueRouter.put(
    "/issue/update/:id",
    authMiddleware,
    issueController.updateIssue
);
issueRouter.delete(
    "/issue/delete/:id",
    authMiddleware,
    issueController.deleteIssue
);
issueRouter.get(
    "/issue/all/:id",
    optionalAuthMiddleware,
    issueController.getAllIssue
);
issueRouter.get(
    "/issue/:id",
    optionalAuthMiddleware,
    issueController.getIssueById
);

module.exports = issueRouter;