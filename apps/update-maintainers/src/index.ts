import {join} from 'path'

export async function main() {
  // clone repos
  // const maintainersInfoFileName = 'maintainers-info.yaml'
  // const dataDir = join(__dirname, '..', 'data')
  // const reposToUpdate = 
  const version = 'rolling'
  const reposFileUrl = `https://raw.githubusercontent.com/ros2/ros2/${version}/ros2.repos`
  const reposPath = join(cacheDir, `${version}.repos.yaml`)

  cache.makeCacheDir({path: cacheDir, isForceRefresh: false})
  cache.downloadFile({path: reposPath, url: reposFileUrl})
  // const reposFileContent = reposFile.getRepos(reposPath)

  const repo = repos.repositories[0]
  const repoPath = join(cacheDir, repo.org, repo.name)
  await cache.pullGitRepo({
    url: repo.url,
    version: version,
    destinationPath: repoPath,
  })

  // update maintainers
  // open PRs for repos
}

if (require.main === module) {
  main()
}
