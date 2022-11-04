import * as z from 'zod'

// TYPES

export const personSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
})

export type Person = z.infer<typeof personSchema>
