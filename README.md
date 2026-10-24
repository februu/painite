<div align="center">

### ミ★ 𝚙𝚊𝚒𝚗𝚒𝚝𝚎 ★彡

_Painite is a small Jira clone._

⠀· · ─────── · 𖥸 · ─────── · ·

</div>

This app was created as a project for the Advanced Databases course. Don't use it. It sucks lmao.

## Running the app

Create a `.env` file at the root of the repo (or copy `.env.example`):

```sh
POSTGRES_DB=painite
POSTGRES_USER=painite
POSTGRES_PASSWORD=painite
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

Then start the app and the database:

```sh
docker compose up --build
```

The app is available at http://localhost:5173.

## Test data

All seeded users have the password `test`.

| Email               | Role  |
| ------------------- | ----- |
| `admin@test.com`    | admin |
| `test@test.com`     | user  |
| `kowalski@test.com` | user  |
| `nowak@test.com`    | user  |
