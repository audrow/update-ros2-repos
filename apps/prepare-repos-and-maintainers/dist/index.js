"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  getRepos: () => getRepos
});
module.exports = __toCommonJS(src_exports);
var import_sync = require("csv-parse/sync");
var import_fs = __toESM(require("fs"));
var import_node_fetch = __toESM(require("node-fetch"));
var import_path = __toESM(require("path"));
var z = __toESM(require("zod"));
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
    const { status } = await (0, import_node_fetch.default)(url);
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
  const maintainersCsv = import_fs.default.readFileSync(
    import_path.default.join(__dirname, "..", "data", "2022-09-14-maintainers.csv")
  );
  const data = (0, import_sync.parse)(maintainersCsv);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getRepos
});
//# sourceMappingURL=index.js.map