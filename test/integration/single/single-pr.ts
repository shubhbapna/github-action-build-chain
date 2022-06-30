import { Octokit } from "@octokit/rest";

const owner = "kie-build-chain-test";
const octokit = new Octokit();

test("target:branchA to target:branchB", async () => {
    const repo = "project-A";
    const head = "branchA";
    const base = "branchB";

    // create a PR
    await octokit.pulls.create({
        owner,
        repo,
        head,
        base
    });

    // get associated workflow and check status
    // keep checking until workflow is success and keep a timeout 


});