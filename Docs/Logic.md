AI Transcript Search Logic
This document explains the search algorithm used in the Video Gallery application. The search is a hybrid system combining Semantic Vector Search with Keyword Heuristics.

Overview
The search engine allows users to find video moments by typing conceptual queries (e.g., "raw footage", "camera settings") even if the exact words are not spoken in the video. It uses machine learning embeddings to understand meaning and traditional keyword matching to refine precision.

Core Components
1. Vector Embeddings (The "Brain")
Model: Xenova/paraphrase-multilingual-MiniLM-L12-v2
Function: Converts every 3-sentence chunk of video transcript into a 384-dimensional vector (a list of numbers representing meaning).
Storage: Vectors are pre-calculated and stored in 
vector_index.jsonl
.
Querying: When you search, your query is also converted into a vector.
2. Scoring Algorithm
Every transcript chunk is given a score from 0.0 to 1.0+ based on how well it matches the query.

Step A: Base Semantic Score
We calculate the Cosine Similarity between your query vector and the transcript vector.

Score ~1.0: Perfect conceptual match.
Score ~0.5: Strong relation.
Score ~0.25: Moderate relation.
Score ~0.0: No relation.
Step B: Keyword Modifications (Hybrid Logic)
We adjust the base score to favor results that contain your specific keywords, while still allowing purely semantic matches.

Exact Phrase Match (Boost 2.0x):

If the transcript contains your exact query string (e.g., "red camera"), the score is doubled.
Keyword Presence (Boost 1.5x or Penalty 0.65x):

We split your query into keywords (longer than 2 chars).
All Keywords Found: Score multiplied by 1.5.
Some Match: Score multiplied by 0.65 (Partial match penalty).
No Keywords Found: No Penalty (1.0x).
Note: Previously, this was penalized by 0.5x, which hid relevant cross-lingual results (e.g., English query vs Turkish video). This penalty was removed to allow the AI's understanding to shine.
Complex Query Logic:

For long queries (>3 words), if >75% of words match, we apply a 1.3x boost.
3. Filtering and Results
Threshold: Only results with a final score > 0.25 are returned.
Sorting: Results are sorted by score (highest first).
Limit: Top 50 results are returned to the UI.
4. Transcript Acquisition & Processing
The system does not rely on manual captions. It automatically fetches and processes auto-generated captions from YouTube.

Fetching Logic
Tool: yt-dlp (embedded via 
TranscriptService.js
).
Command: yt-dlp --write-auto-sub --skip-download --sub-lang tr,en ...
Output: VTT (WebVTT) subtitle files.
Parsing: The VTT files are parsed into text chunks.
Smart Chunking: Sentences are grouped into 500-1000 character blocks to provide enough context for the AI embedding model.
Deduplication: Repeated lines (common in auto-captions) are cleaned up.
5. User Navigation (Time-Seeking)
When a user clicks a search result:

Timestamp Calculation: The system takes the 
start
 timestamp (e.g., 00:04:15.270) from the matching transcript chunk.
Conversion: This is converted into total seconds (e.g., 255s).
Deep Linking: The system generates a direct YouTube URL with the time parameter:
Format: https://www.youtube.com/watch?v={VIDEO_ID}&t={SECONDS}s
Action: Opens the video on YouTube directly at the exact moment the phrase was spoken.
