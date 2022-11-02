import {mkdirSync, writeFileSync} from 'fs'
import {dump as dumpYaml} from 'js-yaml'
import {join} from 'path'
import {migrateMaintainersInfo} from '../src/maintainers-info-helpers'
import {processMaintainersAssignmentSheet} from '../src/process-maintainers-assignment-sheet'

function writeYaml({data: maintainers, path}: {data: unknown; path: string}) {
  const maintainersYaml = dumpYaml(maintainers, {
    indent: 2,
  })
  writeFileSync(path, maintainersYaml)
}

async function main() {
  const isWriteFiles = true

  const dataDir = join(__dirname, '..', 'data')
  const outputDir = join(__dirname, '..', 'out')
  const cacheDir = join(__dirname, '..', 'cache')
  for (const dir of [outputDir, cacheDir]) {
    mkdirSync(dir, {recursive: true})
  }

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
      path: join(outputDir, `${dateString}-maintainer-assignments.yaml`),
    })
    writeYaml({
      data: newMaintainers,
      path: join(outputDir, `${dateString}-maintainers-info.yaml`),
    })
  }
}

main()
