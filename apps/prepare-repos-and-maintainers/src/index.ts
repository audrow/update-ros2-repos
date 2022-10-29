import {parse as csvParse} from 'csv-parse/sync'
import fs from 'fs'
import path from 'path'
import {getRepos} from './get-repos'
export {getRepos} from './get-repos'

async function main() {
  const maintainersCsv = fs.readFileSync(
    path.join(__dirname, '..', 'data', '2022-09-14-maintainers.csv'),
  )
  const reposColumnLetter = 'a'
  const maintainersStartColumnLetter = 'n'
  const headingRowNumber = 2
  const isCheckUrls = false
  const githubUrlPrefix = 'https://github.com/'
  const data = csvParse(maintainersCsv)

  const {repos, maintainers} = await getRepos({
    maintainersCsvData: data,
    headingRowNumber,
    maintainersStartColumnLetter,
    reposColumnLetter,
    githubUrlPrefix,
    isCheckUrls,
  })
  console.log(JSON.stringify({repos, maintainers}, null, 2))
}

main()
