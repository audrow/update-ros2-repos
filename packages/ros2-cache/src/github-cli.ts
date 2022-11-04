import {spawnSync} from 'child_process'
import * as z from 'zod'

const MakePullRequestProps = z.object({
  repoPath: z.string(),
  repo: z.string(),
  baseBranchName: z.string(),
  title: z.string(),
  body: z.string(),
  reviewerIds: z.string().array().default([]).optional(),
  isDryRun: z.boolean().default(true).optional(),
  isVerbose: z.boolean().default(false).optional(),
})

type MakePullRequestProps = z.infer<typeof MakePullRequestProps>

export async function makePullRequest(props: MakePullRequestProps) {
  const {
    repoPath,
    repo,
    baseBranchName,
    reviewerIds,
    title,
    body,
    isDryRun,
    isVerbose,
  } = MakePullRequestProps.parse(props)

  const command = 'gh'
  const args = [
    'pr',
    'create',
    '--base',
    baseBranchName,
    '--repo',
    repo,
    '--title',
    `"${title}"`,
    '--body',
    `"${body}"`,
  ]
  if (reviewerIds && reviewerIds.length > 0) {
    args.push('--reviewer', reviewerIds.join(','))
  }

  await runCommand({command, args, cwd: repoPath, isDryRun, isVerbose})
}

const RunCommandProps = z.object({
  cwd: z.string(),
  command: z.string(),
  args: z.array(z.string()).optional(),
  isDryRun: z.boolean().optional(),
  isVerbose: z.boolean().optional(),
})
type RunCommandProps = z.infer<typeof RunCommandProps>

async function runCommand(props: RunCommandProps) {
  const {command, args, cwd, isDryRun, isVerbose} = RunCommandProps.parse(
    props,
    {
      path: ['runCommand'],
    },
  )
  const commandString = [command, ...(args ?? [])].join(' ')
  if (isDryRun) {
    console.log(`Would run the following command from ${cwd}: ${commandString}`)
  } else {
    console.log(`Running command from ${cwd}: ${commandString}`)
    const {status} = spawnSync(command, args, {
      cwd,
      shell: true,
      stdio: isVerbose ? 'inherit' : 'ignore',
    })
    if (status !== 0) {
      throw new Error(`Command failed to run in '${cwd}': '${commandString}`)
    }
  }
}

async function main() {
  await makePullRequest({
    repoPath: 'path/to/repo',
    repo: 'ros2cli',
    baseBranchName: 'rolling',
    title: 'Test PR',
    body: 'This is a test PR',
    isDryRun: true,
    reviewerIds: ['audrow', 'clalancette'],
  })
}

if (require.main === module) {
  main()
}
