import endent from 'endent'
import {readFileSync} from 'fs'
import yaml from 'js-yaml'
import {join} from 'path'
import {cache, fileSystem, github, makePullRequest} from 'ros2-cache'
import * as z from 'zod'
import {Maintainer, MaintainersInfo} from './maintainers-info-helpers'
import {ReposAssignments} from './process-maintainers-assignment-sheet'
import {updateRepoMaintainers} from './update-repo-maintainers'

export async function main() {
  // config
  const version = 'rolling'
  const maxSetupPyLineLength = 99
  const newBranchName = 'audrow/update-maintainers'
  const isDryRun = false
  const isVerbose = true
  const isForceRefresh = true
  const isAddReviewers = true
  const generatedByRepoUrl = 'https://github.com/audrow/update-ros2-repos'

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
  const {maintainers: maintainersInfo} = MaintainersInfo.parse(
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
      generatedByRepoUrl,
    })

    try {
      await fileSystem.pushRepo({
        repoPath,
        branch: newBranchName,
        remote: 'origin',
        isDryRun,
      })

      const title = `[${version.toUpperCase()}] Update maintainers`
      const body = endent`
        This PR updates the maintainers and code owners. The new maintainers are:
        ${newMaintainers
          .map((maintainer) => `* ${maintainer.name} (@${maintainer.id})`)
          .join('\n')}

        This PR was made with ${generatedByRepoUrl}.
      `

      const alreadyOpen = await github.isPrAlreadyOpen({
        name: repo.name,
        org: repo.org,
        targetBranch: version,
        title,
      })
      if (!alreadyOpen) {
        await makePullRequest({
          repoPath,
          title,
          body,
          repo: `${repo.org}/${repo.name}`,
          baseBranchName: version,
          reviewerIds: isAddReviewers ? repo.maintainers : [],
          isDryRun,
          isVerbose,
        })
      } else {
        console.log(`PR already open for ${repo.name}`)
      }
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
