# C-Song — Learn Chinese Through Songs

A personal study app that displays annotated Chinese song lyrics with pinyin, Vietnamese translations, vocabulary, and grammar notes. Built with React + TypeScript + Vite.

## Quick Start

```bash
npm install
npm run dev
```

Build for production: `npm run build`

---

## How to Add a New Song

### 1. Prepare the input file

Create a new `.md` file in the `songs/` folder. Use the template at `songs/song-input-template.md`:

```markdown
# 歌曲标题 (中文)

Vietnamese Title: Tên bài hát (Tiếng Việt)

YouTube: https://www.youtube.com/watch?v=XXXXX

## Lyrics

歌词第一行
歌词第二行
歌词第三行
```

**Rules:**

- The `# Title` must be in Chinese
- Include the YouTube URL for the embedded player
- Paste all lyric lines under `## Lyrics` — one line per row, no numbering needed
- Only include Chinese lyrics (skip any non-Chinese lines)

### 2. Generate annotations with the AI agent

Open VS Code with Copilot Chat and invoke the **Chinese Song Annotator** agent:

1. Open the chat panel (⌘⇧I or Ctrl+Shift+I)
2. Type `@Chinese Song Annotator` and attach/mention your new song input file
3. The agent will overwrite the input file in-place with full annotations:
   - Table of contents with anchor links
   - Pinyin romanization for each line
   - Vietnamese translation
   - Vocabulary with HSK level tags
   - Grammar / usage notes
   - Cultural context (when relevant)
   - A Vietnamese analysis section at the end

### 3. Register the song in the app

Add an import and entry in `src/data/songs.ts` so the app picks up the new song.

---

## Project Structure

```
songs/              — Song markdown files (input + annotated)
src/
  components/       — React UI components
  data/songs.ts     — Song registry (imports all .md files)
  lib/              — Markdown parser & utilities
  models/           — TypeScript interfaces
.github/agents/     — AI agent definitions
```
