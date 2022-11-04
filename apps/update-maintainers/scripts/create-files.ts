import {mkdirSync, writeFileSync} from 'fs'
import {dump as dumpYaml} from 'js-yaml'
import {join} from 'path'
import {migrateMaintainersInfo} from '../src/maintainers-info-helpers'
import {processMaintainersAssignmentSheet} from '../src/process-maintainers-assignment-sheet'

function writeYaml({data, path}: {data: unknown; path: string}) {
  const outputYaml = dumpYaml(data, {
    indent: 2,
  })
  writeFileSync(path, outputYaml)
}

async function main() {
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
  const urlColumnLetter = 'b'
  const maintainersStartColumnLetter = 'o'
  const headingRowNumber = 2

  const {repos, maintainerIds: newMaintainerIds} =
    await processMaintainersAssignmentSheet({
      path: maintainersAssignmentSheetPath,
      headingRowNumber,
      maintainersStartColumnLetter,
      reposColumnLetter,
      urlColumnLetter,
    })
  const newMaintainers = migrateMaintainersInfo({
    oldMaintainersInfoPath,
    newMaintainerIds,
  })

  if (isWriteFiles) {
    const dateString = new Date().toISOString().split('T')[0]
    writeYaml({
      data: repos,
      path: join(dataDir, `${dateString}-maintainer-assignments.yaml`),
    })
    writeYaml({
      data: newMaintainers,
      path: join(dataDir, `${dateString}-maintainers-info.yaml`),
    })
  }
}

if (require.main === module) {
  main()
}
