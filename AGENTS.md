# Workey Frontend Rules

- Work only inside this `frontend` directory. The sibling `backend-reference` directory is read-only.
- This product is the job-seeker web application and complements the job-seeker mobile application.
- Use the Mobile App Postman collection as the primary API contract. Never invent backend endpoints, request fields, or response fields.
- Employer dashboard and platform-admin features are out of scope.
- Use strict TypeScript and Next.js App Router conventions.
- Prefer Server Components unless client-side interaction is required.
- Prepare interfaces for Arabic RTL and English LTR.
- Reuse existing components and utilities before adding new ones.
- Use centralized semantic design tokens; do not repeat hard-coded colors, spacing, typography, radii, shadows, or layout dimensions.
- Avoid unnecessary dependencies and unrelated file changes.
- Work on one requested feature at a time and stop at the stated scope.
- Run lint and a production build after every task, and fix errors introduced by the task.
