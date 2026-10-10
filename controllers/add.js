const fs = require('fs').promises;
const path = require("path");


async  function addRepo(filePath){
    const repoPath = path.resolve(process.cwd(),".nayiGit");
    const stagingPath = path.join(repoPath,"staging");

    try{
       await fs.mkdir(stagingPath,{recursive:true});
       const fileName = path.basename(filePath);
       await fs.copyFile(fileName,path.join(stagingPath,fileName));
       console.log(`File ${fileName} added to the Staging area! `);

    }catch(err){
        console.error("Error adding file : ",err);
    }
}


module.exports = {addRepo};