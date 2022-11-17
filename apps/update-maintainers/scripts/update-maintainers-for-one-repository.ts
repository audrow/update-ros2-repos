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
  const repoOrgAndName = 'ros2/demos'
  const version = 'rolling'
  const maxSetupPyLineLength = 99
  const newBranchName = 'audrow/update-maintainers'
  const isDryRun = true
  const isForceRefresh = true
  const isSkipPackageXmlIfFails = false

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

  const repo = repositories.find((r) => `${r.org}/${r.name}` === repoOrgAndName)
  if (!repo) {
    throw new Error(`Could not find repository: ${repoOrgAndName}`)
  }

  await makeUpdateMaintainersPr({
    additionalReviewers,
    cacheDir,
    isAddMaintainersAsReviewers,
    isDryRun,
    isSkipPackageXmlIfFails,
    maintainers,
    maxSetupPyLineLength,
    newBranchName,
    projectUrl: GENERATED_BY_REPO_URL,
    repo,
    titleUniqueIdentifier,
    version,
  })
}

if (require.main === module) {
  main()
}
