import endent from 'endent'
import {join} from 'path'
import {cache, fileSystem, github, makePullRequest} from 'ros2-cache'
import * as z from 'zod'
import {Maintainer} from './maintainers-info-helpers'
import {RepoAssignments} from './process-maintainers-assignment-sheet'

import {updateRepositoryMaintainers} from './update-repository-maintainers'

export const MakeUpdateMaintainersPrProps = z.object({
  additionalReviewers: z.array(z.string()),
  cacheDir: z.string(),
  isAddMaintainersAsReviewers: z.boolean(),
  isDryRun: z.boolean(),
  isVerbose: z.boolean(),
  maintainers: Maintainer.array(),
  maxSetupPyLineLength: z.number(),
  newBranchName: z.string(),
  projectUrl: z.string(),
  repo: RepoAssignments,
  reposToIgnore: z.array(z.string()).optional(),
  titleUniqueIdentifier: z.string(),
  version: z.string(),
})

export type MakeUpdateMaintainersPrProps = z.infer<
  typeof MakeUpdateMaintainersPrProps
>

export async function makeUpdateMaintainersPr(
  props: MakeUpdateMaintainersPrProps,
) {
  const {
    additionalReviewers,
    cacheDir,
    isAddMaintainersAsReviewers,
    isDryRun,
    isVerbose,
    maintainers,
    maxSetupPyLineLength,
    newBranchName,
    projectUrl,
    repo,
    reposToIgnore,
    titleUniqueIdentifier,
    version,
  } = MakeUpdateMaintainersPrProps.parse(props)
  if ((reposToIgnore ?? []).includes(`${repo.org}/${repo.name}`)) {
    return
  }

  const repoPath = join(cacheDir, repo.org, repo.name)
  await cache.pullGitRepo({
    url: repo.url,
    version,
    destinationPath: repoPath,
  })
  const newMaintainers = z.array(Maintainer).parse(
    repo.maintainers.map((maintainerId) => {
      return maintainers.find((maintainer) => maintainer.id === maintainerId)
    }),
  )
  newMaintainers.sort((a, b) => a.name.localeCompare(b.name))

  await updateRepositoryMaintainers({
    repoPath,
    maxLineLength: maxSetupPyLineLength,
    maintainers: newMaintainers,
    repoName: repo.name,
    newBranchName,
    baseBranchName: version,
    generatedByRepoUrl: projectUrl,
  })

  await fileSystem.pushRepo({
    repoPath,
    branch: newBranchName,
    remote: 'origin',
    isDryRun,
  })

  const title = `[${version.toUpperCase()}] Update maintainers - ${titleUniqueIdentifier}`
  const body = endent`
        This PR updates the maintainers and code owners. The new maintainers are:
        ${newMaintainers
          .map((maintainer) => `* ${maintainer.name} (@${maintainer.id})`)
          .join('\n')}

        This PR was made with ${projectUrl}.
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
      reviewerIds: isAddMaintainersAsReviewers
        ? combineLists(repo.maintainers, additionalReviewers)
        : additionalReviewers,
      isDryRun,
      isVerbose,
    })
  } else {
    console.log(`PR already open for ${repo.name}`)
  }
}

function combineLists<T>(...lists: T[][]) {
  const set = new Set<T>()
  for (const list of lists) {
    for (const item of list) {
      set.add(item)
    }
  }
  return Array.from(set)
}

export default updateRepositoryMaintainers