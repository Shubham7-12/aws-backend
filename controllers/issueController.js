const mongoose = require("mongoose");
const Repository = require("../models/repoModel");

const Issue = require("../models/issueModel");



async function createIssue(req, res) {
    const { title, description } = req.body;
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            error: "Invalid repository ID!"
        });
    }


    try {
        if (!title || !description) {
            return res.status(400).json({
                error: "Title and description are required!"
            });
        }

        const repository = await Repository.findById(id);

        if (!repository) {
            return res.status(404).json({
                error: "Repository not found!"
            });
        }
        if (repository.owner.toString() !== req.user.id) {
           return res.status(403).json({
          error: "Only the repository owner can create issues!"
        });
}

        const issue = new Issue({
            title,
            description,
            repository: repository._id,
        });

        await issue.save();

        repository.issues.push(issue._id);
        await repository.save();

        return res.status(201).json(issue);

    } catch (err) {
        console.error("Error during issue creation:", err.message);

        return res.status(500).json({
            error: "Server error"
        });
    }
}




async function updateIssue(req, res) {
    const { id } = req.params;
    const { title, description, status } = req.body;
    
if (title === undefined && description === undefined && status === undefined) {
    return res.status(400).json({
        error: "At least one field (title, description, or status) is required!"
    });
}


    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            error: "Invalid issue ID!"
        });
    }

    try {

        const issue = await Issue.findById(id);

        if (!issue) {
            return res.status(404).json({
                error: "Issue not found!"
            });
        }
        const repository = await Repository.findById(issue.repository);

      if (!repository) {
      return res.status(404).json({ error: "Repository not found!" });
      }

      if (repository.owner.toString() !== req.user.id) {
       return res.status(403).json({
        error: "Only the repository owner can update this issue!"
      });
      }

        if (title !== undefined) {
            issue.title = title;
        }

        if (description !== undefined) {
            issue.description = description;
        }

        if (status !== undefined) {
            if (!["open", "closed"].includes(status)) {
                return res.status(400).json({
                    error: "Status must be 'open' or 'closed'!"
                });
            }

            issue.status = status;
        }

        await issue.save();

        return res.status(200).json(issue);

    } catch (err) {
        console.error("Error during issue update:", err.message);

        return res.status(500).json({
            error: "Server error"
        });
    }
}




async function deleteIssue(req, res) {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            error: "Invalid issue ID!"
        });
    }

try {

 const issue = await Issue.findById(id);

if (!issue) {
    return res.status(404).json({ error: "Issue not found!" });
}

const repository = await Repository.findById(issue.repository);

if (!repository) {
    return res.status(404).json({ error: "Repository not found!" });
}

if (repository.owner.toString() !== req.user.id) {
    return res.status(403).json({
        error: "Only the repository owner can delete this issue!"
    });
}

await Issue.findByIdAndDelete(id);

await Repository.findByIdAndUpdate(repository._id, {
    $pull: { issues: issue._id }
});

return res.status(200).json({
      message: "Issue deleted successfully!"
});

} catch (err) {
        console.error("Error during issue deletion:", err.message);
        return res.status(500).json({
            error: "Server error"
        });
    }
}


async function getAllIssue  (req,res){
    const {id} = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            error: "Invalid repository ID!"
        });
    }


    try{
     
const repository = await Repository.findById(id);

if (!repository) {
    return res.status(404).json({
        error: "Repository not found!"
    });
}
if (!repository.visibility) {
    const isOwner = req.user?.id === repository.owner.toString();

    if (!isOwner) {
        return res.status(404).json({
            error: "Repository not found!"
        });
    }
}

const issues = await Issue.find({ repository: id });


    res.status(200).json(issues);


    }catch(err){
     console.error("Error during fetching issues !!",err.message);
     res.status(500).send("Server error");
    }

};

async function getIssueById  (req,res){
    const {id}=req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
        error: "Invalid issue ID!"
    });
}

   try{
    const issue = await Issue.findById(id);
    
    if(!issue){
        return res.status(404).json({error:"Issue not found!"})
    }
const repository = await Repository.findById(issue.repository);

if (!repository) {
    return res.status(404).json({
        error: "Repository not found!"
    });
}

if (!repository.visibility) {
    const isOwner = req.user?.id === repository.owner.toString();

    if (!isOwner) {
        return res.status(404).json({
            error: "Issue not found!"
        });
    }
}
    
    
    res.json(issue);

   }catch(err){
     console.error("Error during issue fetching !!",err.message);
     res.status(500).send("Server error");
    }


};

module.exports={
    createIssue,
    updateIssue,
    deleteIssue,
    getIssueById,
    getAllIssue,
}