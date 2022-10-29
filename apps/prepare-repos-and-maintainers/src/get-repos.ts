import fetch from "node-fetch"
import * as z from 'zod'

const repoFromUrlSchema = z.object({
  org: z.string(),
  name: z.string(),
  url: z.string().url(),
  validUrl: z.boolean().nullable(),
})

type RepoFromUrl = z.infer<typeof repoFromUrlSchema>

const repoSchema = z.object({
  maintainers: z.array(z.string().min(1)),
}).merge(repoFromUrlSchema)

export type Repo = z.infer<typeof repoSchema>

export async function getRepos({
  maintainersCsvData,
  headingRowNumber,
  maintainersStartColumnLetter,
  reposColumnLetter,
  githubUrlPrefix,
  isCheckUrls,
}: {
  maintainersCsvData: string[][]
  headingRowNumber: number
  maintainersStartColumnLetter: string
  reposColumnLetter: string
  githubUrlPrefix: string
  isCheckUrls: boolean
}) {
  const heading = maintainersCsvData[headingRowNumber - 1]
  const people = z
    .array(z.string().min(2))
    .parse(heading.slice(letterToIndex(maintainersStartColumnLetter)))

  const repos = await Promise.all(
    maintainersCsvData
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

  const maintainers = repos.reduce((acc: string[], repo) => {
    repo.maintainers.forEach((maintainer) => {
      if (!acc.includes(maintainer)) {
        acc.push(maintainer)
      }
    })
    return acc
  }, [])

  return {
    maintainers,
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

  let validUrl: boolean | null = null
  if (isCheckUrl) {
    const {status} = await fetch(url)
    validUrl = status === 200
    if (validUrl === false) {
      console.log(`repo ${url} returned status ${status}`)
    }
  }

  return {
    org,
    name,
    url,
    validUrl,
  }
}

function letterToIndex(letter: string): number {
  return z.string().length(1).parse(letter).charCodeAt(0) - 97
}
