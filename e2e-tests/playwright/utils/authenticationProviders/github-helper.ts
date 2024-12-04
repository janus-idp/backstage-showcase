import * as constants from "./constants";
import { App } from "octokit";
import { LOGGER } from "../logger";
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
    //TBD: improve nested team creation
    await createTeam(
      constants.GH_TEAMS[key].name,
      constants.AUTH_PROVIDERS_GH_ORG_NAME,
    );
  }

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

  await setParentTeam(
    constants.GH_TEAMS["team_3"].name,
    constants.AUTH_PROVIDERS_GH_ORG_NAME,
    constants.GH_TEAMS["team_2"].name,
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

export async function deleteTeam(team: string, org: string) {
  try {
    LOGGER.info(`Deleting team from github ${team} in org ${org}`);
    return await octokit.rest.teams.deleteInOrg({ team_slug: team, org });
  } catch (e) {
    if (e.message.includes("Not Found")) {
      LOGGER.info(`Team already deleted: ${team} in org ${org}`);
    } else {
      LOGGER.info(`Cannot delete team: ${e.statusCode}-${JSON.stringify(e)}`);
      throw e;
    }
  }
}

export async function setParentTeam(
  team: string,
  org: string,
  parentTeam: string,
) {
  try {
    const parentTeamObj = await getTeamByName(parentTeam, org);
    LOGGER.info(
      `Adding parent team ${JSON.stringify(parentTeamObj.data.name)} to team ${team}`,
    );
    const r = await octokit.rest.teams.updateInOrg({
      team_slug: team,
      org,
      parent_team_id: parentTeamObj.data.id,
    });
    return r;
  } catch (e) {
    LOGGER.info(`Error setting github parent team: ${JSON.stringify(e)}`);
  }
}

export async function createTeam(team: string, org: string) {
  const r = await octokit.rest.teams.create({
    name: team,
    org,
    privacy: "closed",
  });
  LOGGER.info(`Creation team response: ${JSON.stringify(r.status)}`);
  return r;
}

export async function listTeams(org: string) {
  return await octokit.rest.teams.list({ org });
}

export async function listTeamsMembers(teamSlug: string, org: string) {
  return await octokit.rest.teams.listMembersInOrg({
    org,
    team_slug: teamSlug,
  });
}

export async function addMemberToTeam(
  teamSlug: string,
  org: string,
  member: string,
) {
  return await octokit.rest.teams.addOrUpdateMembershipForUserInOrg({
    org,
    team_slug: teamSlug,
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
  teamSlug: string,
  org: string,
  member: string,
) {
  return await octokit.rest.teams.removeMembershipForUserInOrg({
    org,
    team_slug: teamSlug,
    username: member,
  });
}
