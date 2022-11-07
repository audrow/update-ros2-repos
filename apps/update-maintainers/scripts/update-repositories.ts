import {readFileSync} from 'fs'
import yaml from 'js-yaml'
import {join} from 'path'
import {cache} from 'ros2-cache'
import {
  GENERATED_BY_REPO_URL,
  MaintainersInfo,
  makeUpdateMaintainersPr,
  ReposAssignments,
} from '../src/index'

export async function main() {
  // config
  const version = 'rolling'
  const maxSetupPyLineLength = 99
  const newBranchName = 'audrow/update-maintainers'
  const isDryRun = true
  const isVerbose = true
  const isForceRefresh = true
  const reposToIgnore = [
    'ros2/ros2_documentation',
    'ros2/rclpy', // do Humble
    // 'ros2/rclcpp', // do Humble
  ]

  const isAddMaintainersAsReviewers = true
  const additionalReviewers = ['clalancette']
  const titleUniqueIdentifier = '2022-11-07' // Suggest this is a date

  // Setup
  const dataDir = join(__dirname, '..', 'data')
  const reposAssignmentsPath = join(
    dataDir,
    '2022-11-04-maintainer-assignments.yaml',
  )
  const maintainersInfoPath = join(dataDir, '2022-11-04-maintainers-info.yaml')

  const {repositories} = ReposAssignments.parse(
    yaml.load(readFileSync(reposAssignmentsPath, 'utf8')),
    {
      path: ['MaintainersAssignments', 'repositories'],
    },
  )
  const {maintainers} = MaintainersInfo.parse(
    yaml.load(readFileSync(maintainersInfoPath, 'utf8')),
    {
      path: ['MaintainersInfo'],
    },
  )

  const cacheDir = join(__dirname, '..', 'cache', version)
  cache.makeCacheDir({path: cacheDir, isForceRefresh})

  // run it!
  const errors: {repoName: string; error: unknown}[] = []
  for await (const repo of repositories) {
    try {
      await makeUpdateMaintainersPr({
        additionalReviewers,
        cacheDir,
        isAddMaintainersAsReviewers,
        isDryRun,
        isVerbose,
        maintainers,
        maxSetupPyLineLength,
        newBranchName,
        projectUrl: GENERATED_BY_REPO_URL,
        repo,
        reposToIgnore,
        titleUniqueIdentifier,
        version,
      })
    } catch (e) {
      console.error(e)
      errors.push({repoName: repo.name, error: e})
    }
  }
  if (errors.length > 0) {
    console.error('Finished with errors:')
    for (const {error, repoName} of errors) {
      console.error(` - ${repoName}: ${JSON.stringify(error, null, 2)}`)
    }
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
