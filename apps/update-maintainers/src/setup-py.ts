import * as z from 'zod'
import type {Person} from './__types__'
import {personSchema} from './__types__'

export function getMaintainers(text: string) {
  const nameMatches = text.match(/maintainer=["|'](.*)["|']/)
  const emailMatches = text.match(/maintainer_email=["|'](.*)["|']/)
  if (!nameMatches || !emailMatches) {
    return []
  }
  const names = nameMatches[1].split(',').map((name) => name.trim())
  const emails = emailMatches[1].split(',').map((email) => email.trim())
  if (names.length !== emails.length) {
    throw new Error(
      `Number of maintainer names does not match number of emails`,
    )
  }
  const out: Person[] = []
  for (let i = 0; i < names.length; i++) {
    out.push(personSchema.parse({name: names[i], email: emails[i]}))
  }
  return out
}

export const setMaintainersOptionsSchema = z.object({
  maxLineLength: z.number().optional().default(99),
})

export type SetMaintainersOptions = z.infer<typeof setMaintainersOptionsSchema>

export function setMaintainers(
  text: string,
  maintainers: Person[],
  options?: SetMaintainersOptions,
) {
  // Build replacement maintainer name string
  options = setMaintainersOptionsSchema.parse(options || {})
  const maintainerNameRegex = /( *)maintainer=(?:.*), *(?:# noqa: E501)?\n/
  const nameMatch = text.match(maintainerNameRegex)
  if (!nameMatch) {
    throw new Error(`Could not find maintainer in setup.py`)
  }
  const nameIndent = nameMatch[1]
  let replaceNameString =
    `${nameIndent}maintainer='${maintainers.map((m) => m.name).join(', ')}` +
    "',"
  replaceNameString = addNoqaE501IfTooLong(
    replaceNameString,
    options.maxLineLength,
  )
  replaceNameString += '\n'

  // Build replacement maintainer email string
  const maintainerEmailRegex =
    /( *)maintainer_email=(?:.*), *(?:# noqa: E501)?\n/
  const emailMatch = text.match(maintainerEmailRegex)
  if (!emailMatch) {
    throw new Error(`Could not find maintainer email in setup.py`)
  }
  const emailIndent = emailMatch[1]
  let replaceEmailString =
    `${emailIndent}maintainer_email='${maintainers
      .map((m) => m.email)
      .join(', ')}` + "',"
  replaceEmailString = addNoqaE501IfTooLong(
    replaceEmailString,
    options.maxLineLength,
  )
  replaceEmailString += '\n'

  // Replace maintainer
  return text
    .replace(maintainerNameRegex, replaceNameString)
    .replace(maintainerEmailRegex, replaceEmailString)
}

function addNoqaE501IfTooLong(text: string, maxLength: number) {
  if (text.length > maxLength) {
    return text + '  # noqa: E501'
  }
  return text
}
