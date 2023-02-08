import { Act } from "@kie/act-js";
import { EventJSON } from "@kie/act-js/build/src/action-event/action-event.types";
import { readFileSync } from "fs";
import path from "path";
import { logActOutput } from "../helper/logger";

type TestCommand = {
  name: string;
  cmd: string;
  env?: Record<string, string>;
  eventPayload?: EventJSON;
};

describe("test custom cli e2e commands", () => {
  const testCases: TestCommand[] = JSON.parse(
    readFileSync(path.join(__dirname, "tests.json"), "utf8")
  ) as TestCommand[];

  for (const testCase of testCases) {
    test(testCase.name, async () => {
      let act = new Act()
        .setGithubToken(process.env["GITHUB_TOKEN"] ?? "token")
        .setEnv("GITHUB_REPOSITORY", "");

      for (const key of Object.keys(testCase.env ?? {})) {
        act = act.setEnv(key, testCase.env![key]);
      }

      if (testCase.eventPayload) {
        act = act.setEvent(testCase.eventPayload);
      }

      const result = await act.runEvent("pull_request", {
        ...logActOutput(`${testCase.name}.log`),
        workflowFile: path.join(__dirname),
        mockSteps: {
          build: [
            {
              name: "Execute build-chain",
              mockWith: `${testCase.cmd} -d`,
            },
          ],
        },
      });

      // console.log(result);

      expect(true).toBe(true);
    });
  }
});
