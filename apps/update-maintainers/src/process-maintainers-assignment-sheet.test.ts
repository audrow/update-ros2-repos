import path from 'path'
import {processMaintainersAssignmentSheet} from './process-maintainers-assignment-sheet'

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
    const urlColumnLetter = 'b'
    const maintainersStartColumnLetter = 'n'
    const headingRowNumber = 2

    const {repos, maintainerIds} = await processMaintainersAssignmentSheet({
      path: maintainersAssignmentSheetPath,
      headingRowNumber,
      maintainersStartColumnLetter,
      reposColumnLetter,
      urlColumnLetter,
    })
    expect(repos).toMatchSnapshot()
    expect(maintainerIds).toMatchSnapshot()
  })
})
