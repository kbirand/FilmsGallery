# Git Backup & Restore Guide

This guide explains how to use Git to backup your work and restore it if something goes wrong.

## 1. Checking Status
Before doing anything, see what files have changed:
```bash
git status
```
- **Red files**: Changed but not staged (not ready to commit).
- **Green files**: Staged and ready to commit.

## 2. Backing Up (Saving Your Work)
To save your current progress, run these two commands:

1. **Stage all changes:**
   ```bash
   git add .
   ```

2. **Commit (Save) with a message:**
   ```bash
   git commit -m "Description of what I changed"
   ```
   *Example:* `git commit -m "Fixed search layout and added docs"`

## 3. Viewing History
To see your previous backups (commits):
```bash
git log --oneline
```
You will see a list like this:
```
a1b2c3d Fixed search layout
e5f6g7h Initial backup
```
The code on the left (e.g., `a1b2c3d`) is the **Commit Hash**. You need this to restore.

## 4. Restoring (Going Back in Time)

### ⚠️ Warning
**Restoring to a previous state will DELETE any unsaved work done after that point.**

### Option A: Soft Restore (Undo last commit, keep file changes)
If you committed too early and want to undo the *save* but keep your file edits:
```bash
git reset --soft HEAD~1
```

### Option B: Hard Restore (DANGER: Reset files to exact state)
If you broke something and want to go back to exactly how it was at a specific point:
1. Find the **Commit Hash** using `git log --oneline`.
2. Run:
   ```bash
   git reset --hard <COMMIT_HASH>
   ```
   *Example:* `git reset --hard a1b2c3d`

## 5. Working Safely (Branches)
If you are about to try something risky (like a big refactor), create a "branch" first. This is like a sandbox.

1. **Create and switch to a new branch:**
   ```bash
   git checkout -b experiment-name
   ```
2. Do your work. usage `git add .` and `git commit` as usual.
3. **If it works:** Merge it back to main.
   ```bash
   git checkout main
   git merge experiment-name
   ```
4. **If it fails:** Just go back to main and delete the experiment.
   ```bash
   git checkout main
   git branch -D experiment-name
   ```
