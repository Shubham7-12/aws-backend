const fs = require("fs");
const path = require("path");
const {promisify} = require("util");

const readdir = promisify(fs.readdir);
const copyFile = promisify(fs.copyFile);

async function revertRepo(commitID){
    const repoPath = path.resolve(process.cwd(),".nayiGit");
    const commitsPath = path.join(repoPath,"commits");

    try {
       const commitDir = path.join(commitsPath, commitID);
       const files = await readdir(commitDir);
       const parentsDir = path.resolve(repoPath, "..");

       for(const file of files){
        // Don't copy commit metadata
            if (file === "commit.json") {
                continue;
            }
        await copyFile(
            path.join(commitDir,file),
            path.join(parentsDir,file)
        );
       }
       console.log(`Commit ${commitID} reverted successfully!`);
       
    }catch(err){
        console.error("Unable to revert : ",err);
    }
}

module.exports ={revertRepo};