const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const User = require("../models/userModel");
const Issue = require("../models/issueModel");

async function createRepository(req, res) {
  const { name, issues, content, description, visibility } = req.body;
  const owner = req.user.id;

  try {
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        error: "A valid repository name is required!",
      });
    }

    if (visibility !== undefined && typeof visibility !== "boolean") {
      return res.status(400).json({
        error: "Visibility must be a boolean value!",
      });
    }

    if (
      content !== undefined &&
      (!Array.isArray(content) ||
        !content.every((item) => typeof item === "string"))
    ) {
      return res.status(400).json({
        error: "Content must be an array of strings!",
      });
    }

    if (description !== undefined && typeof description !== "string") {
      return res.status(400).json({
        error: "Description must be a string!",
      });
    }

    if (
      issues !== undefined &&
      (!Array.isArray(issues) ||
        !issues.every((item) => mongoose.Types.ObjectId.isValid(item)))
    ) {
      return res.status(400).json({
        error: "Issues must be an array of valid issue IDs!",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(owner)) {
      return res.status(400).json({ error: " Invalid User ID !" });
    }

    const existingUser = await User.findById(owner);

    if (!existingUser) {
      return res.status(404).json({
        error: "Owner not found!",
      });
    }

    const existingRepository = await Repository.findOne({
      owner,
      name: name.trim(),
    });

    if (existingRepository) {
      return res.status(409).json({
        error: "You already have a repository with this name!",
      });
    }

    const newRepository = new Repository({
      name: name.trim(),
      description,
      visibility,
      owner,
      content,
      issues: [],
    });
    const result = await newRepository.save();

    res.status(201).json({
      message: "Repository Created!",
      repositoryID: result._id,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: "You already have a repository with this name!",
      });
    }

    console.error("Error during repository creation:", err.message);

    return res.status(500).json({
      error: "Server error",
    });
  }
}

async function getAllRepositories(req, res) {
  try {
    const repositories = await Repository.find({
      visibility: true,
    })
      .populate("owner", "-password")
      .populate("issues", "title status");

    return res.status(200).json(repositories);
  } catch (err) {
    console.error("Error during fetching repositories:", err.message);

    return res.status(500).json({
      error: "Server error",
    });
  }
}

async function fetchRepositoriesById(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: "Invalid Repository ID!",
    });
  }

  try {
    const repository = await Repository.findById(id)
      .populate("owner", "-password")
      .populate("issues");

    if (!repository) {
      return res.status(404).json({
        error: "Repository not found!",
      });
    }

    const ownerId = repository.owner._id.toString();
    const isOwner = req.user?.id === ownerId;

    if (!repository.visibility && !isOwner) {
      return res.status(404).json({
        error: "Repository not found!",
      });
    }

    return res.status(200).json(repository);
  } catch (err) {
    console.error("Error during fetching repository:", err.message);

    return res.status(500).json({
      error: "Server error",
    });
  }
}

async function fetchRepositoriesByName(req, res) {
  const { name } = req.params;

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
      error: "A valid repository name is required!",
    });
  }

  try {
    const repositories = await Repository.find({
      name: name.trim(),
      visibility: true,
    })
      .populate("owner", "-password")
      .populate("issues", "title status");

    if (repositories.length === 0) {
      return res.status(404).json({
        error: "No repositories found with this name!",
      });
    }

    return res.status(200).json(repositories);
  } catch (err) {
    console.error("Error during fetching repositories !", err.message);
    res.status(500).send("Server error");
  }
}

async function fetchRepositoriesForCurrentUser(req, res) {
  const { userID } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userID)) {
    return res.status(400).json({
      error: "Invalid User ID!",
    });
  }

  try {
    const isOwnProfile = req.user.id === userID;

    const query = isOwnProfile
      ? { owner: userID }
      : { owner: userID, visibility: true };

    const repositories = await Repository.find(query)
      .populate("owner", "-password")
      .populate("issues", "title status");

    return res.status(200).json(repositories);
  } catch (err) {
    console.error("Error during fetching user repositories:", err.message);

    return res.status(500).json({
      error: "Server error",
    });
  }
}

async function updateRepositoryById(req, res) {
  const { id } = req.params;
  const { content, description } = req.body;

  if (content === undefined && description === undefined) {
    return res.status(400).json({
      error: "At least one field (content or description) is required!",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: "Invalid Repository ID!",
    });
  }

  try {
    const repository = await Repository.findById(id);

    if (!repository) {
      return res.status(404).json({
        error: "Repository not found!",
      });
    }

    if (repository.owner.toString() !== req.user.id) {
      return res.status(403).json({
        error: "You are not authorized to update this repository!",
      });
    }

    if (content !== undefined) {
      if (
        !Array.isArray(content) ||
        !content.every((item) => typeof item === "string")
      ) {
        return res.status(400).json({
          error: "Content must be an array of strings!",
        });
      }

      if (!Array.isArray(repository.content)) {
        repository.content = [];
      }

      repository.content.push(...content);
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        return res.status(400).json({
          error: "Description must be a string!",
        });
      }

      repository.description = description.trim();
    }

    const updatedRepository = await repository.save();

    res.json({
      message: "Repository Update Successfully!!",
      repository: updatedRepository,
    });
  } catch (err) {
    console.error("Error during Updating repository !", err.message);
    res.status(500).send("Server error");
  }
}

async function toggleVisibilityById(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: "Invalid Repository ID!",
    });
  }

  try {
    const repository = await Repository.findById(id);

    if (!repository) {
      return res.status(404).json({
        error: "Repository not found!",
      });
    }

    if (repository.owner.toString() !== req.user.id) {
      return res.status(403).json({
        error: "You are not authorized to change this repository's visibility!",
      });
    }

    repository.visibility = !repository.visibility;

    const updatedRepository = await repository.save();

    return res.status(200).json({
      message: "Repository visibility toggled successfully!",
      repository: updatedRepository,
    });
  } catch (err) {
    console.error("Error during toggling visibility !", err.message);
    res.status(500).send("Server error");
  }
}

async function deleteRepositoryById(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: "Invalid Repository ID!",
    });
  }

  try {
    const repository = await Repository.findById(id);

    if (!repository) {
      return res.status(404).json({
        error: "Repository not found!",
      });
    }

    if (repository.owner.toString() !== req.user.id) {
      return res.status(403).json({
        error: "You are not authorized to delete this repository!",
      });
    }

    await Issue.deleteMany({ repository: repository._id });

    await Repository.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Repository deleted successfully!",
    });
  } catch (err) {
    console.error("Error during Deleting Repo !", err.message);
    res.status(500).send("Server error");
  }
}

module.exports = {
  createRepository,
  getAllRepositories,
  fetchRepositoriesById,
  fetchRepositoriesByName,
  fetchRepositoriesForCurrentUser,
  updateRepositoryById,
  toggleVisibilityById,
  deleteRepositoryById,
};
