# Updated Instructions for the LLM Coding Workflow (with syntax specification)

## Master Prompt

I’m working on a Tower Defense game. I’ll give you the complete existing directory structure and source files, then request specific changes. **Before** you propose changes:

1. **Check for missing files**: Confirm you have all relevant files so you don’t have to guess or assume.  
2. **Get user preference for multiple possible solutions**: If you have more than one way to address a problem, **ask which approach** I prefer **before** providing a large multi-solution update.  
3. **Consider large files or repeated logic**: If you see a file growing too large, or repeated logic across files, **propose** that we split or refactor. But first **ask** me if I want that done.

Once we settle on the approach:

1. Provide **only** the following information referred to as an "current changes" **within a single fenced code block** (which I will save to a file named `current_changes.txt`):
   - **Design decisions made**  
   - **Summary of changes**  
   - **Directories that need created**  
   - **Directories that need deleted**  
   - **Files that need deleted**  
   - **Files that need updated**  
   - **Content of files that are changed** (complete file contents if overwriting)  
   - **A unique hash** to identify this set of changes  
   - **A timestamp** (when ChatGPT produced these changes)

### Syntax Specification

Please structure your code-block output **exactly** as follows (in the same order and with the same section headings). These headings are case-insensitive, but the script expects each section to start on its own line with a trailing colon:

```
Design decisions:
<one or more lines describing design decisions>

Summary of changes:
<one or more lines describing summary of changes>

Directories that need created:
<one directory path per line, or leave blank if none>

Directories that need deleted:
<one directory path per line, or leave blank if none>

Files that need deleted:
<one file path per line, or leave blank if none>

Files that need updated:
<one file path per line, or leave blank if none>

Content of files that are changed:
===== FILE: path/to/firstFile.ext =====
<file content>
===== END FILE =====
===== FILE: path/to/secondFile.ext =====
<file content>
===== END FILE =====

<leave one blank line immediately after the last "===== END FILE =====">

Unique Hash: <a unique string or ID>
Timestamp: <a date/time string>
```

> **Important**  
> - For each changed file, use the **exact** markers:
>   - `===== FILE: path/to/file.ext =====`  
>   - `===== END FILE =====`
> - Ensure you place a **blank line** after the final `===== END FILE =====`.
> - Include both **Unique Hash** and **Timestamp** at the end, as shown above.

## Workflow Overview

1. **ChatGPT**: Returns the new changes in the above format (within a single code block, no shell script).  
2. **Developer**: Copies the code block and saves it into `current_changes.txt` (unmodified).  
3. **Developer**: Runs `./update_script.sh`, which:
   - Parses `current_changes.txt`.  
   - Creates or deletes directories as necessary.  
   - Deletes any removed files.  
   - **Before** changing a file, records its original size, then overwrites or creates it with the new content.  
   - Generates a change log in `./change_log` using the design decisions and summary from `current_changes.txt`.  
   - Provides diagnostic output about the steps performed.

## Additional Requirements and Best Practices

- **Avoid backslashes** in paths (use forward slashes on Mac OS).  
- If you’re unsure about any approach, ask for clarification **before** outputting the final code block.  
- Provide verbose or explanatory text only outside the final code block. The final code block should strictly follow the syntax specification.

## Final Output

- The LLM’s response must **not** include a shell script—only the items listed above, in the specified order and format.  
- The local `./update_script.sh` applies these changes automatically.  
- Once changes are applied, you can run `npm start` (or other commands) to test your updated project.