import {readFileSync} from 'fs'
import yaml from 'js-yaml'
import {join} from 'path'
import {cache} from 'ros2-cache'
import * as z from 'zod'
import {Maintainer, MaintainersInfo} from './maintainers-info-helpers'
import {ReposAssignments} from './process-maintainers-assignment-sheet'
import {updateRepoMaintainers} from './update-repo-maintainers'

export async function main() {
  const version = 'rolling'
  const maxSetupPyLineLength = 99
  const newBranchName = 'audrow/update-maintainers'

  // clone repos
  // const maintainersInfoFileName = 'maintainers-info.yaml'
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
  const {maintainers: maintainersInfo} = MaintainersInfo.parse(
    yaml.load(readFileSync(maintainersInfoPath, 'utf8')),
    {
      path: ['MaintainersInfo'],
    },
  )

  const cacheDir = join(__dirname, '..', 'cache', version)
  cache.makeCacheDir({path: cacheDir, isForceRefresh: true})

  for await (const repo of repositories) {
    const repoPath = join(cacheDir, repo.org, repo.name)
    await cache.pullGitRepo({
      url: repo.url,
      version,
      destinationPath: repoPath,
    })
    const newMaintainers = z.array(Maintainer).parse(
      repo.maintainers.map((maintainerId) => {
        return maintainersInfo.find(
          (maintainer) => maintainer.id === maintainerId,
        )
      }),
    )
    await updateRepoMaintainers({
      repoPath,
      maxLineLength: maxSetupPyLineLength,
      maintainers: newMaintainers,
      repoName: repo.name,
      newBranchName,
      baseBranchName: version,
    })
    break
  }
  // update maintainers
  // open PRs for repos
}

if (require.main === module) {
  main()
}
