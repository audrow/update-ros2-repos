import fs from 'fs'
import {dirname, resolve} from 'path'
import simpleGit from 'simple-git'

export async function getBranch({
  repoPath,
}: {
  repoPath: string
}): Promise<string> {
  const git = simpleGit(repoPath)
  return (await git.branch()).current
}

export async function createNewBranch({
  repoPath,
  baseBranchName,
  newBranchName,
}: {
  repoPath: string
  baseBranchName: string
  newBranchName: string
}) {
  const git = simpleGit(repoPath)
  await git.checkout(baseBranchName)
  await git.checkoutLocalBranch(newBranchName)
}

export async function pushRepo({
  repoPath,
  isDryRun,
}: {
  repoPath: string
  isDryRun: boolean
}) {
  const git = simpleGit(repoPath)
  try {
    if (!isDryRun) {
      await git.push()
    } else {
      return `Would push the repo: ${repoPath}`
    }
  } catch (e) {
    console.error(`Could not push the repo at: ${repoPath}`)
    throw e
  }
}

export async function createCommit({
  repoPath,
  commitMessage,
}: {
  repoPath: string
  commitMessage: string
}) {
  const git = simpleGit(repoPath)
  try {
    await git.add('.')
    await git.commit(commitMessage, undefined, {'--signoff': null})
  } catch (e) {
    console.error(`Could not create commit: ${commitMessage}`)
    throw e
  }
}

export async function createAndCommitFile({
  repoPath,
  filePath,
  fileContent,
  commitMessage,
}: {
  repoPath: string
  filePath: string
  fileContent: string
  commitMessage: string
}) {
  const absoluteFilePath = resolve(filePath)

  fs.mkdirSync(dirname(absoluteFilePath), {recursive: true})
  fs.writeFileSync(absoluteFilePath, fileContent)

  const git = simpleGit(repoPath)
  await git.add(absoluteFilePath)

  await createCommit({repoPath, commitMessage})
}

export async function deleteFileAndCommit({
  repoPath,
  filePath,
  commitMessage,
}: {
  repoPath: string
  filePath: string
  commitMessage: string
}) {
  const absoluteFilePath = resolve(filePath)
  fs.rmSync(absoluteFilePath)

  const git = simpleGit(repoPath)
  await git.add(absoluteFilePath)

  await createCommit({repoPath, commitMessage})
}

export async function resetBranch({
  repoPath,
  version,
}: {
  repoPath: string
  version: string
}) {
  const git = simpleGit(repoPath)
  await git.reset(['--hard', version])
  await git.clean('f', ['-d'])
  await git.stash()
}
