import type {Person} from './__types__'
import {personSchema} from './__types__'

// UTILS

export function comparePeopleByName(a: Person, b: Person) {
  if (a.name < b.name) {
    return -1
  } else if (a.name > b.name) {
    return 1
  }
  return 0
}

export function isPersonInList(person: Person, people: Person[]) {
  for (const p of people) {
    if (isSamePerson(person, p)) {
      return true
    }
  }
  return false
}

export function isSamePerson(p1: Person, p2: Person) {
  return p1.name === p2.name || p1.email === p2.email
}

// GETTERS + SETTERS
const MAINTAINER_TAG = 'maintainer'
const AUTHOR_TAG = 'author'

export function getPerson(text: string, tag: string) {
  const personRegex = new RegExp(
    `<${tag}\\s*(?:|email="(.*)")>(.*)</${tag}>`,
    'g',
  )
  const matches = [...text.matchAll(personRegex)]
  if (!matches) {
    throw new Error(`No matches for tag ${tag}`)
  }
  return matches.map((match) => {
    return personSchema.parse({
      name: match[2],
      email: match[1],
    })
  })
}

export function getMaintainers(text: string) {
  return getPerson(text, MAINTAINER_TAG)
}

export function getPackageXmlAuthors(text: string) {
  return getPerson(text, AUTHOR_TAG)
}

export function setMaintainers(text: string, maintainers: Person[]) {
  const authors = getOldMaintainersAsAuthors(text, maintainers)
  text = setAuthors(text, authors)
  return setPeople(text, maintainers, MAINTAINER_TAG)
}

function getOldMaintainersAsAuthors(text: string, maintainers: Person[]) {
  const previousMaintainers = getMaintainers(text)
  const previousAuthors = getPackageXmlAuthors(text)
  const newAuthors = previousMaintainers.filter((maintainer) => {
    const isNewMaintainer = isPersonInList(maintainer, maintainers)
    const isCurrentAuthors = isPersonInList(maintainer, previousAuthors)
    return !isNewMaintainer && !isCurrentAuthors
  })
  const authors = [...previousAuthors, ...newAuthors].sort(comparePeopleByName)
  return authors
}

function setAuthors(text: string, authors: Person[]) {
  return setPeople(text, authors, AUTHOR_TAG)
}

function setPeople(text: string, people: Person[], tag: string) {
  const regex = new RegExp(
    `(\\n+)( *)(?:<${tag}\\s*(?:|email="(?:.*)")>(?:.*)</${tag}>\\s*)+`,
  )
  const match = text.match(regex)
  if (!match) {
    throw new Error(`Could not find '${tag}' tag in package.xml`)
  }
  // match[1] captures the newline characters and makes it easy to put a space around the tag
  const indent = match[2]
  let replaceString = '\n\n' // create a line before the tag group
  people.forEach((person) => {
    if (person.email) {
      replaceString += `${indent}<${tag} email="${person.email}">${person.name}</${tag}>\n`
    } else {
      replaceString += `${indent}<${tag}>${person.name}</${tag}>\n`
    }
  })
  replaceString += `\n${indent}` // create an empty line after the tag group
  return text.replace(regex, replaceString)
}
