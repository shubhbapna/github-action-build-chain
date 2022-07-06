import { EventData, GitConfiguration, ProjectConfiguration } from "@bc/domain/configuration";
import { constants } from "@bc/domain/constants";
import { FlowType } from "@bc/domain/inputs";
import { BaseConfiguration } from "@bc/service/config/base-configuration";
import { OctokitFactory } from "@bc/service/git/octokit";
import { logAndThrow } from "@bc/utils/log";
import Container from "typedi";

export class CLIConfiguration extends BaseConfiguration{

    loadProject(): {source: ProjectConfiguration, target: ProjectConfiguration} {
        if (this.parsedInputs.flowType === FlowType.BRANCH){
            const projectName = this.parsedInputs.startProject!.split("/");
            const projectConfig = {
                branch: this.parsedInputs.branch,
                name: projectName[projectName.length - 1],
                group: this.parsedInputs.group ? this.parsedInputs.group : projectName[0],
                repository: this.parsedInputs.startProject
            };
            return {
                source: projectConfig,
                target: projectConfig
            };
        } else {
            return {
                source: {
                    branch: this.gitEventData.head.ref,
                    repository: this.gitEventData.head.repo?.full_name,
                    name: this.gitEventData.head.repo?.name,
                    group: this.gitEventData.head.repo?.owner.login
                },
                target: {
                    branch: this.gitEventData.base.ref,
                    repository: this.gitEventData.base.repo.full_name,
                    name: this.gitEventData.base.repo.full_name,
                    group: this.gitEventData.base.repo.owner.login
                }
            };
        }
    }

    loadGitConfiguration(): GitConfiguration {
        const serverUrl = process.env.GITHUB_SERVER_URL ? process.env.GITHUB_SERVER_URL.replace(/\/$/, "") : "https://github.com";
        let gitConfig: GitConfiguration = {
            serverUrl: serverUrl,
            serverUrlWithToken: serverUrl?.replace("://", `://${Container.get(constants.GITHUB.TOKEN)}@`),
            author: this.gitEventData.head.user.login
        };
        if (this.parsedInputs.flowType === FlowType.BRANCH) {
            const group = (this.parsedInputs.group) ? this.parsedInputs.group : this.parsedInputs.startProject?.split("/")[0];
            if (!group) {logAndThrow("Specify group option or set project name as GROUP_NAME/REPO_NAME");}
            gitConfig =  {
                ...gitConfig,
                actor: group,
                ref: this.parsedInputs.branch,
            };
        }
        return gitConfig;
    }

    async loadGitEvent(): Promise<EventData> {
        if (this.parsedInputs.CLISubCommand === FlowType.BRANCH) {return {};}
        if (!this.parsedInputs.url) {logAndThrow("If running from the CLI, event url needs to be defined");}
        const PR_URL = /^https?:\/\/.+\/([^/\s]+)\/([^/\s]+)\/pull\/(\d+)$/;
        const prCheck = this.parsedInputs.url.match(PR_URL);
        if (prCheck) {
            this.logger.debug("Getting pull request information");
            const { data } = await OctokitFactory.getOctokitInstance().pulls.get({
                owner: prCheck[1],
                repo: prCheck[2],
                pull_number: parseInt(prCheck[3])
            });

            return data;
        }
        logAndThrow(`Invalid event url ${this.parsedInputs.url}\n url must be a github pull request event url or a github tree url`);
    }

    loadToken(): void {
        if (this.parsedInputs.token) {
            Container.set(constants.GITHUB.TOKEN, this.parsedInputs.token);
        } else if (process.env.GITHUB_TOKEN) {
            Container.set(constants.GITHUB.TOKEN, process.env.GITHUB_TOKEN);
        } else {
            logAndThrow("A github token is needed");
        }
    }

}