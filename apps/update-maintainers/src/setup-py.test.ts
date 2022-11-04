import {
  MAINTAINERS,
  MAINTAINERS_READ,
  SETUP_PY,
  SETUP_PY_MODIFIED,
  SETUP_PY_NO_MAINTAINERS,
} from './test-data/test-data'

import {getMaintainers, setMaintainers} from './setup-py'

test('get maintainers', () => {
  const maintainers = getMaintainers(SETUP_PY_MODIFIED)
  expect(MAINTAINERS_READ.length).toBe(maintainers.length)
  expect(JSON.stringify(MAINTAINERS_READ)).toBe(JSON.stringify(maintainers))
})

test('set maintainers', () => {
  const originalMaintainers = getMaintainers(SETUP_PY)
  const newPackageXml = setMaintainers(SETUP_PY, MAINTAINERS)
  const newMaintainers = getMaintainers(SETUP_PY_MODIFIED)

  expect(SETUP_PY_MODIFIED).toBe(newPackageXml)
  expect(JSON.stringify(MAINTAINERS_READ)).toBe(JSON.stringify(newMaintainers))
  expect(originalMaintainers).not.toBe(newMaintainers)
})

test('get maintainers with no maintainers', () => {
  const maintainers = getMaintainers(SETUP_PY_NO_MAINTAINERS)
  expect(maintainers.length).toBe(0)
})

test('throw error on set with no maintainers', () => {
  expect(() => {
    setMaintainers(SETUP_PY_NO_MAINTAINERS, MAINTAINERS)
  }).toThrow()
})
