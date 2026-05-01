Look inside `src` directory. The app you are creating is a simple version of a task management system like jira. The app should provide the ability to manage users, projects and tasks. Your main task is to deal with UI part. Each project should have its own tasks and settings (custom priorities and statuses). The users can be invited to projects by project owners. They can then browse through them and display them. User can be assigned or assign themselves to tasks. The tasks can be modified (title, description, status, priority) by project owners and the assigned users. There should also be ability to give comments to specific tasks by all of the users assigned to the project. 

**Guidelines:**
- Use correct Svelte 5 with TailwindCSS and Daisy UI classes to build out the UI. Put reusable components and section components inside their respective files inside `src/lib/components`. Use svelte check periodically to check for errors.
- You can view `db/init.sql` to see the schema. It lacks `comments` table right now. You can add comments to it giving suggestions for new tables and fields but dont modify it directly.
- All functions that return data from or insert data to database should be put and imported from `src/server/database.ts`. Dont fill them with queries now. Use placeholder data. I will do it myself. Just leave empty functions signatures.
- All of the logic that can be executed by the database should be done there. For example, DON'T use functions like `GetAllUsers()` everywhere and then filter it yourself with TypeScript inside component code. Instead, create different functions inside `src/server/database.ts`, import them and assume that database returns the exact data you need. I fill later fill it out with SQL queries with respective filters.

Before starting, ask questions if anything is ambiguous or unclear. DONT make important project decisions on your own. Ask before advancing in critical moments.

1. Build out simple /login route. Make so that the / redirect to /dashboard or /login depending on whether user is logged in.
3. suggest adding color to projects table as a DB schema note.
4.suggest add task_assignees table as a DB schema note.
5. Admin users should see all available projects, all tasks and be able to modify any project bypassing permissions. Normal users can just create their own projects and see the projects they were assigned to.
6. Project owners can modify the project settings. Members can't.