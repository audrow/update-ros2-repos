import {readFileSync} from 'fs'
import {load as loadYaml} from 'js-yaml'
import * as z from 'zod'

export const Maintainer = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
})

export type Maintainer = z.infer<typeof Maintainer>

export const MaintainersInfo = z.object({
  maintainers: z.array(Maintainer),
})

export type MaintainersInfo = z.infer<typeof MaintainersInfo>

const maintainersMap = new Map<string, MaintainersInfo>()
export function getMaintainersInfo(path: string) {
  if (!maintainersMap.has(path)) {
    const maintainersYaml = loadYaml(readFileSync(path, 'utf8'))
    const maintainers = MaintainersInfo.parse(maintainersYaml, {
      path: ['getMaintainers'],
    })
    maintainersMap.set(path, maintainers)
  }
  const maintainers = maintainersMap.get(path)
  if (!maintainers) {
    throw new Error('maintainers should be defined')
  }
  return maintainers
}

export function migrateMaintainersInfo({
  newMaintainerIds,
  oldMaintainersInfoPath = undefined,
}: {
  newMaintainerIds: string[]
  oldMaintainersInfoPath?: string
}) {
  const oldMaintainers = oldMaintainersInfoPath
    ? getMaintainersInfo(oldMaintainersInfoPath)
    : {maintainers: []}
  const newMaintainers: MaintainersInfo = {maintainers: []}
  for (const newMaintainerId of newMaintainerIds) {
    const oldMaintainer = oldMaintainers.maintainers.find(
      (maintainer) => maintainer.id === newMaintainerId,
    )
    if (oldMaintainer) {
      newMaintainers.maintainers.push(oldMaintainer)
    } else {
      newMaintainers.maintainers.push({
        id: newMaintainerId,
        name: 'TODO',
        email: 'TODO@openrobotics.org',
      })
    }
  }
  newMaintainers.maintainers.sort((a, b) => a.id.localeCompare(b.id))
  return newMaintainers
}
