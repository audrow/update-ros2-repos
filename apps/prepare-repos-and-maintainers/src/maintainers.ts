import * as z from 'zod'
import yaml from 'js-yaml'
import fs from 'fs'
import path from 'path'

const maintainersSchema = z.object({
  maintainers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string().email(),
    }),
  ),
})

type Maintainers = z.infer<typeof maintainersSchema>

let maintainers: Maintainers | undefined
const maintainersPath = path.join(__dirname, '..', 'data', 'maintainers.yaml')
export async function getMaintainers() {
  if (!maintainers) {
    const maintainersYaml = yaml.load(fs.readFileSync(maintainersPath, 'utf8'))
    maintainers = maintainersSchema.parse(maintainersYaml, { path: ['getMaintainers']})
  }
}

