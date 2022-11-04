import {
  MAINTAINERS,
  MAINTAINERS_READ,
  PACKAGE_XML,
  PACKAGE_XML_MODIFIED,
  PACKAGE_XML_NO_MAINTAINERS,
} from './test-data/test-data'

import {
  getMaintainers,
  setMaintainers,
} from './package-xml'

test('get maintainers', () => {
  const maintainers = getMaintainers(PACKAGE_XML_MODIFIED)
  expect(MAINTAINERS_READ.length).toBe(maintainers.length)
  expect(JSON.stringify(MAINTAINERS_READ)).toBe(JSON.stringify(maintainers))
})

test('set maintainers', () => {
  const originalMaintainers = getMaintainers(PACKAGE_XML)
  const newPackageXml = setMaintainers(PACKAGE_XML, MAINTAINERS)
  const newMaintainers = getMaintainers(PACKAGE_XML_MODIFIED)

  expect(PACKAGE_XML_MODIFIED).toBe(newPackageXml)
  expect(JSON.stringify(MAINTAINERS_READ)).toBe(JSON.stringify(newMaintainers))
  expect(originalMaintainers).not.toBe(newMaintainers)
})

test('get maintainers with no maintainers', () => {
  const maintainers = getMaintainers(PACKAGE_XML_NO_MAINTAINERS)
  expect(maintainers.length).toBe(0)
})

test('throw error on set with no maintainers', () => {
  expect(() => {
    setMaintainers(PACKAGE_XML_NO_MAINTAINERS, MAINTAINERS)
  }).toThrow()
})
