import path from 'path'
import {
  getRepoFromString,
  processMaintainersAssignmentSheet,
} from './process-maintainers-assignment-sheet'

jest.setTimeout(10000)

describe('processMaintainersAssignmentSheet', () => {
  it('should return repos', async () => {
    const maintainersAssignmentSheetPath = path.join(
      __dirname,
      '..',
      'data',
      '2022-09-14-maintainers-assignment.csv',
    )
    const reposColumnLetter = 'a'
    const maintainersStartColumnLetter = 'n'
    const headingRowNumber = 2
    const isCheckUrls = false
    const githubUrlPrefix = 'https://github.com/'

    const {repos, maintainerIds} = await processMaintainersAssignmentSheet({
      path: maintainersAssignmentSheetPath,
      headingRowNumber,
      maintainersStartColumnLetter,
      reposColumnLetter,
      githubUrlPrefix,
      isCheckUrls,
    })
    expect(repos).toMatchSnapshot()
    expect(maintainerIds).toMatchSnapshot()
  })
})

describe('getRepoFromString', () => {
  it('gets a repo that exists', async () => {
    const repoString = 'ros2/rclcpp'
    const githubUrlPrefix = 'https://github.com/'
    const isCheckUrl = true
    const repoFromUrl = await getRepoFromString(
      repoString,
      githubUrlPrefix,
      isCheckUrl,
    )
    expect(repoFromUrl).toMatchInlineSnapshot(`
      {
        "name": "rclcpp",
        "org": "ros2",
        "url": "https://github.com/ros2/rclcpp",
        "validUrl": true,
      }
    `)
  })
  it("can't find url for a repo that doesn't exist", async () => {
    const repoString = 'ros2/not-a-repo'
    const githubUrlPrefix = 'https://github.com/'
    const isCheckUrl = true
    const repoFromUrl = await getRepoFromString(
      repoString,
      githubUrlPrefix,
      isCheckUrl,
    )
    expect(repoFromUrl).toMatchInlineSnapshot(`
      {
        "name": "not-a-repo",
        "org": "ros2",
        "url": "https://github.com/ros2/not-a-repo",
        "validUrl": false,
      }
    `)
  })
  it('can skip checking a URL', async () => {
    const repoString = 'ros2/rclcpp'
    const githubUrlPrefix = 'https://github.com/'
    const isCheckUrl = false
    const repoFromUrl = await getRepoFromString(
      repoString,
      githubUrlPrefix,
      isCheckUrl,
    )
    expect(repoFromUrl).toMatchInlineSnapshot(`
      {
        "name": "rclcpp",
        "org": "ros2",
        "url": "https://github.com/ros2/rclcpp",
        "validUrl": "not checked",
      }
    `)
  })
})
