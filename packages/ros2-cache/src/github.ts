import dotenv from 'dotenv'
import 'dotenv/config'
import {Octokit} from 'octokit'
import {join} from 'path'
import * as z from 'zod'
dotenv.config({path: join(__dirname, '..', '..', '..', '.env')})

const githubAccessToken = z
  .string()
  .min(2)
  .parse(process.env.GITHUB_TOKEN, {path: ['GITHUB_TOKEN']})
const octokit = new Octokit({auth: githubAccessToken})

export const rest = octokit.rest

export const createPr = octokit.rest.pulls.create

export async function getDefaultBranch({
  org,
  name,
}: {
  org: string
  name: string
}) {
  return (
    await octokit.rest.repos.get({
      owner: org,
      repo: name,
    })
  ).data.default_branch
}

export async function setDefaultBranch({
  org,
  name,
  branch,
}: {
  org: string
  name: string
  branch: string
}) {
  await octokit.rest.repos.update({
    owner: org,
    repo: name,
    default_branch: branch,
  })
}

export async function createNewBranch({
  org,
  name,
  baseBranch,
  newBranchName,
}: {
  org: string
  name: string
  baseBranch: string
  newBranchName: string
}) {
  const sha1 = (
    await octokit.rest.git.getRef({
      owner: org,
      repo: name,
      ref: `heads/${baseBranch}`,
    })
  ).data.object.sha

  await octokit.rest.git.createRef({
    owner: org,
    repo: name,
    ref: `refs/heads/${newBranchName}`,
    sha: sha1,
  })
}

export async function retargetPrs({
  org,
  name,
  fromBranch,
  toBranch,
}: {
  org: string
  name: string
  fromBranch: string
  toBranch: string
}) {
  const prs = await getPrNumbersTargetingABranch({
    org,
    name,
    branch: fromBranch,
  })
  await changePrTargetsToBranch({org, name, branch: toBranch, prs})
}

async function getPrNumbersTargetingABranch({
  org,
  name,
  branch,
  state,
}: {
  org: string
  name: string
  branch: string
  state?: 'open' | 'closed' | 'all'
}) {
  const prs = (
    await octokit.rest.pulls.list({
      owner: org,
      repo: name,
      state,
      base: branch,
    })
  ).data.map((pr) => pr.number)

  return prs
}

async function changePrTargetsToBranch({
  org,
  name,
  branch,
  prs,
}: {
  org: string
  name: string
  branch: string
  prs: number[]
}) {
  for (const pr of prs) {
    await octokit.rest.pulls.update({
      owner: org,
      repo: name,
      pull_number: pr,
      base: branch,
    })
  }
}

export async function isPrAlreadyOpen({
  org,
  name,
  title,
  targetBranch,
}: {
  org: string
  name: string
  title: string
  targetBranch: string
}) {
  const {data} = await octokit.rest.pulls.list({
    owner: org,
    repo: name,
    state: 'open',
    base: targetBranch,
  })
  const matchingPrsCount = data.filter((pr) => pr.title === title).length
  if (matchingPrsCount > 1) {
    throw new Error(
      `Found ${matchingPrsCount} open PRs with the same title and target branch. This should not happen.`,
    )
  }
  return matchingPrsCount === 1
}

async function main() {
  const org = 'audrow'
  const name = 'rclcpp'
  const newBranch = 'rolling'

  const oldBranch = await getDefaultBranch({org, name})
  await createNewBranch({
    org: org,
    name: name,
    baseBranch: oldBranch,
    newBranchName: newBranch,
  })
  await setDefaultBranch({org, name, branch: newBranch})
  await retargetPrs({org, name, fromBranch: oldBranch, toBranch: newBranch})
}

if (typeof require !== 'undefined' && require.main === module) {
  main()
}
