declare function getRepos({ maintainersCsvData, headingRowNumber, maintainersStartColumnLetter, reposColumnLetter, githubUrlPrefix, isCheckUrls, }: {
    maintainersCsvData: string[][];
    headingRowNumber: number;
    maintainersStartColumnLetter: string;
    reposColumnLetter: string;
    githubUrlPrefix: string;
    isCheckUrls: boolean;
}): Promise<{
    org: string;
    name: string;
    url: string;
    validUrl: boolean | null;
    maintainers: string[];
}[]>;

export { getRepos };
