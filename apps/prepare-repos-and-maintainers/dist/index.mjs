// src/index.ts
import { parse as csvParse } from "csv-parse/sync";
import fs from "fs";
import fetch from "node-fetch";
import path from "path";
import * as z from "zod";
var repoFromUrlSchema = z.object({
  org: z.string(),
  name: z.string(),
  url: z.string().url(),
  validUrl: z.boolean().nullable()
});
var repoSchema = z.object({
  maintainers: z.array(z.string().min(1))
}).merge(repoFromUrlSchema);
async function getRepos({
  maintainersCsvData,
  headingRowNumber,
  maintainersStartColumnLetter,
  reposColumnLetter,
  githubUrlPrefix,
  isCheckUrls
}) {
  const heading = maintainersCsvData[headingRowNumber - 1];
  const people = z.array(z.string().min(2)).parse(heading.slice(letterToIndex(maintainersStartColumnLetter)));
  const repos = await Promise.all(
    maintainersCsvData.splice(headingRowNumber).filter((row) => {
      const repoString = row[letterToIndex(reposColumnLetter)];
      return repoString.split("/").length === 2;
    }).map(async (row) => {
      const repoString = z.string().parse(row[letterToIndex(reposColumnLetter)]);
      const isMaintainer = z.array(
        z.preprocess((x) => {
          if (x === "") {
            return false;
          }
          return Number.parseFloat(x) > 0;
        }, z.boolean())
      ).length(people.length).parse(row.slice(letterToIndex(maintainersStartColumnLetter)));
      const maintainers = people.filter(
        (_, index) => isMaintainer[index]
      );
      const repoFromUrl = await getRepoFromString(
        repoString,
        githubUrlPrefix,
        isCheckUrls
      );
      return repoSchema.parse({
        ...repoFromUrl,
        maintainers
      });
    })
  );
  return repos;
}
async function getRepoFromString(repoString, githubUrlPrefix, checkUrl = false) {
  const [org, name] = repoString.split("/");
  const url = `${githubUrlPrefix}${org}/${name}`;
  let validUrl = null;
  if (checkUrl) {
    const { status } = await fetch(url);
    validUrl = status === 200;
    if (validUrl === false) {
      console.log(`repo ${url} returned status ${status}`);
    }
  }
  return {
    org,
    name,
    url,
    validUrl
  };
}
function letterToIndex(letter) {
  return z.string().length(1).parse(letter).charCodeAt(0) - 97;
}
async function main() {
  const maintainersCsv = fs.readFileSync(
    path.join(__dirname, "..", "data", "2022-09-14-maintainers.csv")
  );
  const data = csvParse(maintainersCsv);
  const reposColumnLetter = "a";
  const maintainersStartColumnLetter = "n";
  const headingRowNumber = 2;
  const isCheckUrls = true;
  const githubUrlPrefix = "https://github.com/";
  const repos = await getRepos({
    maintainersCsvData: data,
    headingRowNumber,
    maintainersStartColumnLetter,
    reposColumnLetter,
    githubUrlPrefix,
    isCheckUrls
  });
  repos.forEach((r) => {
    console.log(r);
  });
}
main();
export {
  getRepos
};
//# sourceMappingURL=index.mjs.map