import {parse as csvParse} from 'csv-parse/sync'
import {readFileSync} from 'fs'
import * as z from 'zod'

export const repoSchema = z.object({
  org: z.string(),
  name: z.string(),
  url: z.string().url().endsWith('.git'),
  maintainers: z.array(z.string().min(1)).min(1),
})

export type Repo = z.infer<typeof repoSchema>

export const reposSchema = z.object({
  repositories: z.array(repoSchema),
})

export type Repos = z.infer<typeof reposSchema>

export async function processMaintainersAssignmentSheet({
  path: path,
  headingRowNumber,
  maintainersStartColumnLetter,
  reposColumnLetter,
  urlColumnLetter,
}: {
  path: string
  headingRowNumber: number
  maintainersStartColumnLetter: string
  reposColumnLetter: string
  urlColumnLetter: string
}) {
  const assignmentData = csvParse(readFileSync(path)) as string[][]
  const heading = assignmentData[headingRowNumber - 1]
  const people = z
    .array(z.string().min(2))
    .parse(heading.slice(letterToIndex(maintainersStartColumnLetter)))

  const repos = assignmentData
    .splice(headingRowNumber)
    .filter((row: string[]) => {
      const repoString = row[letterToIndex(reposColumnLetter)]
      return repoString.split('/').length === 2
    })
    .map((row: string[]) => {
      const repoString = row[letterToIndex(reposColumnLetter)]
      const url = row[letterToIndex(urlColumnLetter)]
      const isMaintainer = z
        .array(
          z.preprocess((x: unknown) => {
            if (x === '') {
              return false
            }
            return Number.parseFloat(x as string) > 0
          }, z.boolean()),
        )
        .length(people.length)
        .parse(row.slice(letterToIndex(maintainersStartColumnLetter)))

      const maintainers = people.filter(
        (_: string, index: number) => isMaintainer[index],
      )

      const [org, name] = repoString.split('/')
      return repoSchema.parse({
        name,
        org,
        url,
        maintainers,
      })
    })

  const maintainerIds = repos.reduce((acc: string[], repo) => {
    repo.maintainers.forEach((maintainer) => {
      if (!acc.includes(maintainer)) {
        acc.push(maintainer)
      }
    })
    return acc
  }, [])

  return {
    maintainerIds,
    repos: reposSchema.parse({repositories: repos}),
  }
}

function letterToIndex(letter: string): number {
  return z.string().length(1).parse(letter).charCodeAt(0) - 97
}
