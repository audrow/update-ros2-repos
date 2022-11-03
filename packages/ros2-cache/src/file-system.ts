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
export async function createCommitAndPushFile({
  repoPath,
  filePath,
  fileContent,
  commitMessage,
  isDryRun,
}: {
  repoPath: string
  filePath: string
  fileContent: string
  commitMessage: string
  isDryRun: boolean
}) {
  await createAndCommitFile({
    repoPath,
    filePath,
    fileContent,
    commitMessage,
  })

  const absoluteFilePath = resolve(filePath)
  const git = simpleGit(repoPath)
  try {
    if (!isDryRun) {
      await git.push()
      return `Pushed new commit: ${commitMessage}`
    } else {
      return `Would push new commit: ${commitMessage}`
    }
  } catch (e) {
    console.error(`Could not push the file: ${absoluteFilePath}`)
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
  await git.commit(commitMessage)
}

export function deleteFileAndCommit({
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
  git.add(absoluteFilePath)
  git.commit(commitMessage)
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
}
