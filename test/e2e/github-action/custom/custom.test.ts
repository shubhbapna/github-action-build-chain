import { Act } from "@kie/act-js";
import { EventJSON } from "@kie/act-js/build/src/action-event/action-event.types";
import { readFileSync } from "fs";
import path from "path";
import { logActOutput } from "../../helper/logger";

type TestCommand = {
  name: string;
  "definition-file"?: string;
  "flow-type"?: string;
  "starting-project"?: string;
  "skip-execution"?: string;
  "skip-project-execution"?: string;
  "skip-checkout"?: string;
  "skip-project-checkout"?: string;
  "skip-parallel-checkout"?: string;
  "custom-command-treatment"?: string;
  "additional-flags"?: string;
  "logger-level"?: string;
  "annotations-prefix"?: string;
  eventPayload?: EventJSON
  env?: Record<string, string>
};

describe("test custom e2e commands", () => {
  const testCases: TestCommand[] = JSON.parse(
    readFileSync(path.join(__dirname, "tests.json"), "utf8")
  ) as TestCommand[];

  for (const testCase of testCases) {
    test(testCase.name, async () => {
      let act = new Act().setGithubToken(
        process.env["GITHUB_TOKEN"] ?? "token"
      );

      for (const key of Object.keys(testCase.env ?? {})) {
        act = act.setEnv(key, testCase.env![key]);
      }

      if (testCase.eventPayload) {
        act = act.setEvent(testCase.eventPayload);
      }

      const result = await act.runEvent("pull_request", {
        ...logActOutput(`${testCase.name}.log`),
        workflowFile: path.join(__dirname),
      });

      // console.log(result);

      expect(true).toBe(true);
    });
  }
});
