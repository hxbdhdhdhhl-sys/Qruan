# Live Search Autocomplete & Instant Navigation for NEXUS GAMING

Enhance the global search bar in **NEXUS GAMING** with a fast, keyboard-accessible live autocomplete system that blends instant local matching with real-time Steam catalog and global news headline lookups as users type, enabling one-click navigation to any game page or highlighted news story.

## User Review & Critical Decisions

> [!IMPORTANT]
> All core UX preferences were confirmed during clarification and govern this plan:

- **Confirmed Data Scope**: Autocomplete suggestions combine **Encyclopedia titles** (including custom community/admin entries), the **live Steam Store catalog**, and **global live news headlines**, deduplicated into unified game and news groups.
- **Confirmed News Selection Behavior**: Selecting a news headline navigates directly to the **Nexus News feed** and **highlights the chosen story** in a dedicated top spotlight card (complete with UTC + preferred timezone timestamps, comments access, and a direct link to the original publisher), clearing any conflicting feed filters automatically so the story is always immediately visible.
- **Confirmed Zero-Query Focus State**: Focusing the search bar before typing displays **Recent Searches** (with single-item delete and clear-all controls) alongside **Trending Titles** for rapid discovery.

---

## 1. Overview & Core Concept

- **What It Does**: Upgrades the global workspace search bar into an intelligent predictive command-and-discovery bar. Before typing, users see their recent queries and trending encyclopedia titles. As they type, ranked game titles (with cover thumbnails, developer, release year, platforms, and Metacritic score) and live global news headers (with publisher source and UTC/preferred timestamps) appear in real time—augmented by debounced live queries to the Steam Store and server news cache.
- **Target Audience / Persona**: Bilingual (Arabic & English) gamers, esports followers, and industry readers who want sub-second navigation to specific games (even beyond the local curated catalog) or breaking stories without manually filtering multi-page lists.
- **Key Value**: Cuts multi-step search-and-filter workflows down to a single keystroke or click, eliminating duplicate results between local and live Steam records while keeping full keyboard navigation (`↑`, `↓`, `Enter`, `Esc`, and `/` or `⌘K`/`Ctrl+K` quick focus).

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Zero-Query Discovery (Focus Before Typing)**: Clicking the search input or pressing `⌘K` / `Ctrl+K` (or `/`) opens the suggestion panel showing **Recent Searches** (up to 6 saved queries with individual remove and "Clear all" buttons) and **Trending Games** (1-click jump to standalone Game Detail views).
  2. **Live Predictive Typing**: Typing 1+ characters immediately ranks local Encyclopedia games and loaded News headlines with subtle query-match text highlighting; at 2+ characters, a 180ms debounced background request fetches live Steam catalog matches and fresh server-cached news headers, merging and deduplicating them smoothly without layout jump.
  3. **Game Selection Flow**: Clicking or pressing `Enter` on any Encyclopedia or live Steam game records the query in Recent Searches, closes the popover, and opens its full **Game Detail** page (dynamically resolving live Steam trailers, screenshots, PC specs, and player reviews when selected from Steam).
  4. **News Headline Spotlight Flow**: Clicking or pressing `Enter` on a news headline switches to the **Live Global News** view, resets any restrictive feed filters if needed, scrolls to top, and renders the selected article in an elevated **Highlighted Story Spotlight** banner with full summary, dual UTC + local/preferred timestamps, community comments toggle, external publisher link, and a "Dismiss highlight" control.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Editorial precision paired with high-contrast gaming utility, preserving the strict 3-zone top `<header>` contract while housing the search combobox cleanly inside the operational workspace bar.
  - *Color Palette & Mood*: Deep Obsidian surfaces (`#09090B` / `#121217`) in Dark Mode and crisp gallery white (`#FFFFFF` / `#F4F4F5`) in Light Mode, accented with Electric Cyan (`#06B6D4`) for active keyboard focus, matched text highlights, and spotlight framing, plus Muted Violet (`#8B5CF6`) secondary accents.
  - *Typography & Hierarchy*: `Outfit` / `IBM Plex Sans Arabic` for section headers and titles, `Plus Jakarta Sans` / `IBM Plex Sans Arabic` for clean single-line rows, and `JetBrains Mono` (`tabular-nums`) for Metacritic ratings, prices, and UTC timestamps.
  - *Component Styling & Layout*: Zero-pill metadata discipline—all game and news metadata (`Developer · Year · Platforms`, `Source · YYYY-MM-DD HH:mm UTC`) renders as unboxed inline text separated by `·` dividers. Game rows feature resilient `16:9` / `4:3` cover thumbnails with automatic SVG fallback protection.
- **Interactive Feedback & Motion**:
  - Instant `<100ms` local keystroke response paired with a quiet inline syncing indicator in the dropdown header while remote Steam/news suggestions resolve.
  - Smooth `150ms` opacity/transform transitions, visible keyboard focus rings, full `RTL` (Arabic) and `LTR` (English) alignment, and explicit empty-state guidance offering 1-click full-catalog search when no titles match.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Two-Tier Hybrid Autocomplete (0ms Local + 180ms Debounced Server Proxy)**
  - *Chosen Approach*: Compute ranked matches across loaded Encyclopedia games and News immediately on the client, while firing a debounced, abortable request (`AbortController`) to a unified backend `/api/autocomplete` endpoint for live Steam Store titles and server-cached global news.
  - *Why*: Purely remote autocomplete feels sluggish on slow networks, whereas purely local autocomplete misses thousands of live Steam games. Hybrid merging delivers instant responsiveness plus global catalog breadth, while deduplicating by Steam App ID and normalized title prevents duplicate rows.
  - *Alternatives Considered*: Firing external API calls on every keystroke without debounce (rejected due to upstream rate limits and UI flicker).
- **Decision 2: Dedicated Highlighted Story Spotlight in Nexus News**
  - *Chosen Approach*: Maintain a `highlightedNewsId` state in global context so selecting a news suggestion navigates to the News hub and surfaces that exact story in a prominent top spotlight card (with smooth highlight framing and filter reset if hidden).
  - *Why*: Live news feeds contain 100+ chronological items; simply switching tabs without spotlighting forces users to scroll or hunt for the headline they clicked.
  - *Alternatives Considered*: Opening external publisher links directly (passed over per user preference to keep readers anchored inside Nexus News first).
- **Decision 3: Client-Persisted Recent Searches**
  - *Chosen Approach*: Store up to 6 recent search terms/selections locally in browser storage with one-click removal and clear-all affordances, while continuing to log aggregate anonymous search count metrics to Firestore.
  - *Why*: Works instantaneously for both signed-in players and guests with zero database read overhead on input focus.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     Operational Workspace Search Combobox                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Search Input (⌘K / "/" Shortcut · ArrowUp/Down/Enter/Esc · RTL/LTR)  │  │
│  └───────────────┬──────────────────────────────────────┬───────────────┘  │
│                  │ Focus (Empty Query)                  │ Typing (q >= 1)  │
│                  ▼                                      ▼                  │
│  ┌───────────────────────────────┐      ┌───────────────────────────────┐  │
│  │   Zero-Query Discovery Panel  │      │   Hybrid Suggestion Engine    │  │
│  │ • Recent Searches (Storage)   │      │ • 0ms Local Game/News Ranker  │  │
│  │ • Trending Encyclopedia Games │      │ • 180ms Debounced Fetch       │  │
│  └───────────────┬───────────────┘      └───────────────┬───────────────┘  │
└──────────────────┼──────────────────────────────────────┼──────────────────┘
                   │                                      │ GET /api/autocomplete?q=
                   │                                      ▼
                   │                      ┌───────────────────────────────┐
                   │                      │   Backend Autocomplete Proxy  │
                   │                      │ • Steam Store Search Cache    │
                   │                      │ • Global Live News Cache      │
                   │                      └───────────────┬───────────────┘
                   │                                      │ Deduplicated Merge
                   ▼                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                        Global Navigation & State Hub                       │
│   ├─ Select Game (Encyclopedia or steam_live_<id>) ──► Standalone Game View│
│   └─ Select News Headline (highlightedNewsId)      ──► News Feed Spotlight │
└────────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - **Autocomplete Game Suggestion**: Unified shape `{ id, title, titleAr, developer, releaseYear, platforms, metacritic, coverUrl, isLiveSteam }` where live Steam matches use `steam_live_<appid>` IDs already supported by the Game Detail view.
  - **Autocomplete News Suggestion**: Unified shape `{ id, title, titleAr, sourceName, company, platform, publishedAtUtc, url, isBreaking }`.
  - **Recent Search Entry**: `{ query, timestamp }` persisted in `localStorage` (capped at 6 unique case-insensitive entries).
  - **Highlighted News State**: `highlightedNewsId: string | null` stored in global application context and passed via `navigateTo('news', { newsId })`.

- **Interactive Component & State Mapping**:
  - **Keyboard & Focus Controller**: Global `keydown` listener handles `Cmd+K` / `Ctrl+K` and `/` to focus input; combobox `onKeyDown` manages `activeIndex` across flattened suggestion items (`Recent`, `Games`, `News`, `Search All Footer`), triggering selection on `Enter` and dismissal on `Escape`.
  - **Abortable Live Fetch**: Each keystroke (`q.trim().length >= 2`) cancels any in-flight `AbortController` timer/request before scheduling a 180ms fetch to `/api/autocomplete?q=...`, guaranteeing out-of-order network responses never overwrite newer input.
  - **News Feed Spotlight Synchronization**: When `highlightedNewsId` changes in the News view, active restrictive filters reset if they would hide the target article, the viewport scrolls smoothly to the top spotlight container, and an explicit dismiss button lets the user clear `highlightedNewsId` at any time.
