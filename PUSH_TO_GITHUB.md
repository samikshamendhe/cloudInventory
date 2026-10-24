# Push the Python backend change to GitHub

Run these from the root of your existing `cloudInventory` repository **after** you extract this bundle there and run `./apply_python_migration.sh`.

1. Review what will change:

   ```bash
   git status
   git diff --check
   git diff --stat
   ```

2. Test the Python backend locally from the backend folder:

   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   pytest -q
   cd ..
   ```

3. Test Docker Compose before commit:

   ```bash
   docker compose config --quiet
   docker compose build
   docker compose up -d
   docker compose ps
   ```

4. Commit and push:

   ```bash
   git add -A
   git diff --cached --stat
   git commit -m "Replace Spring Boot backend with Python FastAPI"
   git push origin main
   ```

Do not add `.env`, customer/order export JSON, or any database files to Git. The root `.gitignore` is updated with common database/export patterns as a precaution.

The frontend remains React/JavaScript and CSS. The old Java backend source is removed, and the repository will show Python as a language in GitHub's language breakdown. Because the frontend is still JavaScript, the repository should not be described as a 100% Python project.
