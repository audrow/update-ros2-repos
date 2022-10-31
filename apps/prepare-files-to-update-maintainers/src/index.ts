import { writeFileSync } from 'fs'
import { dump as dumpYaml } from 'js-yaml'
import { join } from 'path'
import { migrateMaintainersInfo } from './maintainers-info-helpers'
import { processMaintainersAssignmentSheet } from './process-maintainers-assignment-sheet'

function writeYaml({
  data: maintainers,
  path,
}: {
  data: unknown,
  path: string
}) {
  const maintainersYaml = dumpYaml(maintainers, {
    indent: 2,
  })
  writeFileSync(path, maintainersYaml)
}

async function main() {

  const isCheckUrls = true
  const isWriteFiles = true

  const dataDir = join(__dirname, '..', 'data')
  const oldMaintainersInfoPath = join(
    dataDir,
    '2021-09-19-maintainers-info.yaml',
  )
  const maintainersAssignmentSheetPath = join(
    dataDir,
    '2022-09-14-maintainers-assignment.csv',
  )

  const reposColumnLetter = 'a'
  const maintainersStartColumnLetter = 'n'
  const headingRowNumber = 2
  const githubUrlPrefix = 'https://github.com/'

  const {repos, maintainerIds: newMaintainerIds} =
    await processMaintainersAssignmentSheet({
      path: maintainersAssignmentSheetPath,
      headingRowNumber,
      maintainersStartColumnLetter,
      reposColumnLetter,
      githubUrlPrefix,
      isCheckUrls,
    })
  const newMaintainers = migrateMaintainersInfo({
    oldMaintainersInfoPath,
    newMaintainerIds,
  })

  if (isWriteFiles) {
    const dateString = new Date().toISOString().split('T')[0]
    writeYaml({
      data: {
        repositories: repos,
      },
      path: join(dataDir, `${dateString}-maintainer-assignments.yaml`),
    })
    writeYaml({
      data: newMaintainers,
      path: join(dataDir, `${dateString}-maintainers-info.yaml`),
    })
  }
}

main()
