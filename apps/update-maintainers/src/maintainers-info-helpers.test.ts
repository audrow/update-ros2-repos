import {
  getMaintainersInfo,
  migrateMaintainersInfo,
} from './maintainers-info-helpers'

import {join} from 'path'

const OLD_MAINTAINERS_INFO_PATH = join(
  __dirname,
  '..',
  'data',
  '2021-09-19-maintainers-info.yaml',
)

describe('getMaintainersInfo', () => {
  it('should parse maintainers info', () => {
    const {maintainers} = getMaintainersInfo(OLD_MAINTAINERS_INFO_PATH)
    expect(maintainers).toMatchSnapshot()
  })
})

describe('migrateMaintainersInfo', () => {
  it('should migrate maintainers info', () => {
    const newMaintainerIds = ['foo', 'bar', 'baz']
    const maintainers = migrateMaintainersInfo({
      oldMaintainersInfoPath: OLD_MAINTAINERS_INFO_PATH,
      newMaintainerIds,
    })
    expect(maintainers).toMatchSnapshot()
  })
  it('should migrate maintainers info with no old maintainers', () => {
    const newMaintainerIds = ['foo', 'bar', 'baz']
    const {maintainers} = migrateMaintainersInfo({
      oldMaintainersInfoPath: undefined,
      newMaintainerIds,
    })
    expect(maintainers.length).toBe(newMaintainerIds.length)
    expect(maintainers).toMatchSnapshot()
  })
})
