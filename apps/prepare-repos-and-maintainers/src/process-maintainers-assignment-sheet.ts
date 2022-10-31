import {parse as csvParse} from 'csv-parse/sync'
import {readFileSync} from 'fs'
import fetch from 'node-fetch'
import * as z from 'zod'

const validUrlSchema = z.union([z.boolean(), z.enum(['not checked'])])
type ValidUrl = z.infer<typeof validUrlSchema>

const repoFromUrlSchema = z.object({
  org: z.string(),
  name: z.string(),
  url: z.string().url(),
  validUrl: validUrlSchema,
})

type RepoFromUrl = z.infer<typeof repoFromUrlSchema>

const repoSchema = z
  .object({
    maintainers: z.array(z.string().min(1)).min(1),
  })
  .merge(repoFromUrlSchema)

export type Repo = z.infer<typeof repoSchema>

export async function processMaintainersAssignmentSheet({
  path: path,
  headingRowNumber,
  maintainersStartColumnLetter,
  reposColumnLetter,
  githubUrlPrefix,
  isCheckUrls,
}: {
  path: string
  headingRowNumber: number
  maintainersStartColumnLetter: string
  reposColumnLetter: string
  githubUrlPrefix: string
  isCheckUrls: boolean
}) {
  const assignmentData = csvParse(readFileSync(path)) as string[][]
  const heading = assignmentData[headingRowNumber - 1]
  const people = z
    .array(z.string().min(2))
    .parse(heading.slice(letterToIndex(maintainersStartColumnLetter)))

  const repos = await Promise.all(
    assignmentData
      .splice(headingRowNumber)
      .filter((row: string[]) => {
        const repoString = row[letterToIndex(reposColumnLetter)]
        return repoString.split('/').length === 2
      })
      .map(async (row: string[]) => {
        const repoString = z
          .string()
          .parse(row[letterToIndex(reposColumnLetter)])
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

        const repoFromUrl = await getRepoFromString(
          repoString,
          githubUrlPrefix,
          isCheckUrls,
        )

        return repoSchema.parse({
          ...repoFromUrl,
          maintainers,
        })
      }),
  )

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
    repos,
  }
}

export async function getRepoFromString(
  repoString: string,
  githubUrlPrefix: string,
  isCheckUrl = false,
): Promise<RepoFromUrl> {
  const [org, name] = repoString.split('/')
  const url = `${githubUrlPrefix}${org}/${name}`

  const validUrl: ValidUrl = isCheckUrl ? await checkUrl(url) : 'not checked'

  return {
    org,
    name,
    url,
    validUrl,
  }
}

async function checkUrl(url: string): Promise<boolean> {
  const {status} = await fetch(url)
  const isValid = status === 200
  if (isValid === false) {
    console.log(`${url} returned status ${status}`)
  }
  return isValid
}

function letterToIndex(letter: string): number {
  return z.string().length(1).parse(letter).charCodeAt(0) - 97
}
