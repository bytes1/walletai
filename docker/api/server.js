const express = require("express");
const { exec } = require("child_process");
const fs = require("fs/promises");
const path = require("path");
const cors = require("cors");

const app = express();
const port = 8080;

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// API endpoint for compiling Solidity code
app.post("/compile", async (req, res) => {
  const { sourceCode, contractName } = req.body;

  if (!sourceCode || !contractName) {
    return res
      .status(400)
      .json({ error: "sourceCode and contractName are required." });
  }

  const foundryProjectPath = path.join("/usr/src/app/foundry_project");
  const tempContractPath = path.join(
    foundryProjectPath,
    "src",
    `${contractName}.sol`
  );
  const outputPath = path.join(
    foundryProjectPath,
    "out",
    `${contractName}.sol`
  );
  const artifactPath = path.join(outputPath, `${contractName}.json`);

  try {
    await fs.writeFile(tempContractPath, sourceCode);
    console.log(`Temporarily created ${tempContractPath}`);

    console.log("Running forge build...");
    await new Promise((resolve, reject) => {
      exec(
        "forge build",
        { cwd: foundryProjectPath },
        (error, stdout, stderr) => {
          if (error) {
            console.error("Forge build failed:", stderr);
            reject(new Error(stderr));
            return;
          }
          console.log("Forge build successful:", stdout);
          resolve(stdout);
        }
      );
    });

    const artifactContent = await fs.readFile(artifactPath, "utf8");
    const artifact = JSON.parse(artifactContent);

    const abi = artifact.abi;
    const bytecode = artifact.bytecode.object;

    if (!abi || !bytecode) {
      throw new Error("ABI or bytecode not found in artifact file.");
    }

    res.json({
      success: true,
      abi,
      bytecode,
    });
  } catch (error) {
    console.error("Error during compilation:", error.message);
    res.status(500).json({
      success: false,
      error: "Compilation failed.",
      details: error.message,
    });
  } finally {
    try {
      await fs.unlink(tempContractPath);
      console.log(`Cleaned up ${tempContractPath}`);
      await fs.rm(path.join(foundryProjectPath, "out"), {
        recursive: true,
        force: true,
      });
      console.log("Cleaned up output directory.");
    } catch (cleanupError) {
      console.error("Error during cleanup:", cleanupError);
    }
  }
});

app.listen(port, () => {
  console.log(
    `✅ Foundry Compilation Service listening at http://localhost:${port}`
  );
});
