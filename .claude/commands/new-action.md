Scaffold a new Server Action for $ARGUMENTS.

1. Read `src/actions/index.ts` to understand the existing pattern (auth check, Prisma usage, return shape).
2. Add the new action following the same pattern:
   - Call `getUser()` and return an error if authentication is required
   - Use the Prisma client from `src/lib/prisma.ts`
   - Return `{ success: true, data: ... }` or `{ success: false, error: string }`
3. Export it from `src/actions/index.ts`.
4. Describe what was added and any follow-up wiring needed (e.g., calling from a component).
