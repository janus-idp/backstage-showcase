import * as constants from "./constants";
import { App } from "octokit";
import { logger } from "../Logger";
import * as helper from "../helper";

const app = new App({
  appId: constants.AUTH_ORG_APP_ID,
  privateKey: constants.AUTH_ORG_PK,
});

const octokit = await app.getInstallationOctokit(54960509);

export async function setupGithubEnvironment() {
  const existingTeams = await listTeams(constants.AUTH_PROVIDERS_GH_ORG_NAME);

  // delete existing teams since they might be messy from last test execution
  for (const team of existingTeams.data) {
    await deleteTeam(team.slug, constants.AUTH_PROVIDERS_GH_ORG_NAME);
  }
  // recreate them
  for (const key in constants.GH_TEAMS) {
    await createTeam(
      constants.GH_TEAMS[key].name,
      constants.AUTH_PROVIDERS_GH_ORG_NAME,
    );
  }

  await setParentTeam(
    constants.GH_TEAMS["team_3"].name,
    constants.AUTH_PROVIDERS_GH_ORG_NAME,
    constants.GH_TEAMS["team_2"].name,
  );

  await addMemberToTeam(
    constants.GH_TEAMS["team_3"].name,
    constants.AUTH_PROVIDERS_GH_ORG_NAME,
    constants.GH_USERS["user_1"].name,
  );
  await addMemberToTeam(
    constants.GH_TEAMS["team_4"].name,
    constants.AUTH_PROVIDERS_GH_ORG_NAME,
    constants.GH_USERS["user_1"].name,
  );
  await addMemberToTeam(
    constants.GH_TEAMS["team_1"].name,
    constants.AUTH_PROVIDERS_GH_ORG_NAME,
    constants.GH_USERS["admin"].name,
  );
  await addMemberToTeam(
    constants.GH_TEAMS["location_admin"].name,
    constants.AUTH_PROVIDERS_GH_ORG_NAME,
    constants.GH_USERS["admin"].name,
  );

  await helper.ensureNewPolicyConfigMapExists(
    "rbac-policy",
    constants.AUTH_PROVIDERS_NAMESPACE,
  );
}

export async function getTeams() {
  return await octokit.rest.teams.list({
    org: constants.AUTH_PROVIDERS_GH_ORG_NAME,
  });
}

export async function getTeamByName(team: string, org: string) {
  return await octokit.rest.teams.getByName({ team_slug: team, org });
}

export async function getTeamMembers() {
  return await octokit.rest.teams.listMembersInOrg({
    org: constants.AUTH_PROVIDERS_GH_ORG_NAME,
    team_slug: "team1",
  });
}

export async function renameTeam(team: string, org: string, newname: string) {
  return await octokit.rest.teams.updateInOrg({
    team_slug: team,
    org,
    name: newname,
  });
}

export async function setParentTeam(
  team: string,
  org: string,
  parentTeam: string,
) {
  const parentTeamObj = await getTeamByName(parentTeam, org);
  return await octokit.rest.teams.updateInOrg({
    team_slug: team,
    org,
    parent_team_id: parentTeamObj.data.id,
  });
}

export async function deleteTeam(team: string, org: string) {
  try {
    logger.info(`Deleting team from github ${team} in org ${org}`);
    return await octokit.rest.teams.deleteInOrg({ team_slug: team, org });
  } catch (e) {
    if (e.message.includes("Not Found")) {
      logger.info(`Team already deleted: ${team} in org ${org}`);
    } else {
      logger.info(`Cannot delete team: ${e.statusCode}-${JSON.stringify(e)}`);
      throw e;
    }
  }
}

export async function createTeam(team: string, org: string) {
  return await octokit.rest.teams.create({
    name: team,
    org,
    privacy: "closed",
  });
}

export async function listTeams(org: string) {
  return await octokit.rest.teams.list({ org });
}

export async function listTeamsMembers(team_slug: string, org: string) {
  return await octokit.rest.teams.listMembersInOrg({
    org,
    team_slug,
  });
}

export async function addMemberToTeam(
  team_slug: string,
  org: string,
  member: string,
) {
  return await octokit.rest.teams.addOrUpdateMembershipForUserInOrg({
    org,
    team_slug,
    username: member,
  });
}

export async function removeUserFromAllTeams(user: string, org: string) {
  const teams = await listTeams(org);
  for (const team of teams.data) {
    const members = await listTeamsMembers(team.name, org);
    if (members.data.map((m) => m.login).includes(user)) {
      await removeMemberToTeam(team.name, org, user);
    }
  }
}

export async function removeMemberToTeam(
  team_slug: string,
  org: string,
  member: string,
) {
  return await octokit.rest.teams.removeMembershipForUserInOrg({
    org,
    team_slug,
    username: member,
  });
}
