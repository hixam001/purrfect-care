"""
Purrfect Care — RAG Ingestion Script (Gemini, new google-genai SDK)
"""

import argparse
import os
import re
import sys
import time
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from google import genai
from supabase import create_client, Client

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

GEMINI_API_KEY    = os.getenv("GEMINI_API_KEY", "")
SUPABASE_URL      = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE  = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
EMBEDDING_MODEL   = os.getenv("GEMINI_EMBEDDING_MODEL", "text-embedding-004")
KNOWLEDGE_DIR     = Path(__file__).parent / "knowledge"
TABLE_NAME        = "cat_health_knowledge"

MIN_CHUNK_WORDS   = 30
MAX_CHUNK_WORDS   = 350
CHUNK_OVERLAP     = 50
DELAY_BETWEEN_CALLS = 0.05   # Gemini free tier is generous — 1500 req/min


# ---------------------------------------------------------------------------
# Markdown Parser
# ---------------------------------------------------------------------------

def parse_markdown_file(filepath: Path) -> list[dict]:
    raw = filepath.read_text(encoding="utf-8")
    chunks = []

    lines = raw.splitlines()
    title = ""
    source = ""
    source_url = ""
    category = ""

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("# "):
            title = stripped[2:].strip()
        elif stripped.lower().startswith("source:") and not stripped.lower().startswith("source_url:"):
            source = stripped.split(":", 1)[1].strip()
        elif stripped.lower().startswith("source_url:"):
            source_url = stripped.split(":", 1)[1].strip()
        elif stripped.lower().startswith("category:"):
            category = stripped.split(":", 1)[1].strip()
        elif stripped == "---":
            break

    sections = re.split(r"\n---\n", raw)

    for section_block in sections:
        section_lines = section_block.strip().splitlines()
        if not section_lines:
            continue

        heading = ""
        section_tag = ""
        content_lines = []
        reading_content = False

        for sline in section_lines:
            stripped = sline.strip()
            if stripped.startswith("## "):
                heading = stripped[3:].strip()
                reading_content = False
                content_lines = []
            elif stripped.lower().startswith("section:"):
                section_tag = stripped.split(":", 1)[1].strip()
                reading_content = True
            elif reading_content:
                content_lines.append(sline)

        if not heading or not content_lines:
            continue

        raw_content = "\n".join(content_lines).strip()
        if not raw_content:
            continue

        prefix = f"{title} — {heading}\n\n"
        full_content = prefix + raw_content

        sub_chunks = split_into_chunks(full_content, MAX_CHUNK_WORDS, CHUNK_OVERLAP)

        for sub in sub_chunks:
            word_count = len(sub.split())
            if word_count < MIN_CHUNK_WORDS:
                print(f"  [SKIP] Too short ({word_count} words): {heading}")
                continue

            chunks.append({
                "title":      f"{title} — {heading}",
                "category":   category,
                "section":    section_tag or "general",
                "content":    sub.strip(),
                "source":     source,
                "source_url": source_url,
            })

    return chunks


def split_into_chunks(text: str, max_words: int, overlap: int) -> list[str]:
    words = text.split()
    if len(words) <= max_words:
        return [text]

    chunks = []
    start = 0
    while start < len(words):
        end = min(start + max_words, len(words))
        chunks.append(" ".join(words[start:end]))
        if end == len(words):
            break
        start += max_words - overlap

    return chunks


# ---------------------------------------------------------------------------
# Embedding — new google.genai SDK
# ---------------------------------------------------------------------------

def embed_text(client: genai.Client, text: str) -> list[float]:
    """Embeds a knowledge chunk using RETRIEVAL_DOCUMENT task type, 768 dims."""
    result = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
        config={
            "task_type": "RETRIEVAL_DOCUMENT",
            "output_dimensionality": 768,   # Matryoshka truncation — fits ivfflat limit
        },
    )
    return result.embeddings[0].values


# ---------------------------------------------------------------------------
# Supabase Upsert
# ---------------------------------------------------------------------------

def insert_chunk(db: Client, chunk: dict, embedding: list[float]) -> None:
    """Inserts a knowledge chunk into Supabase."""
    db.table(TABLE_NAME).insert(
        {
            "title":      chunk["title"],
            "category":   chunk["category"],
            "section":    chunk["section"],
            "content":    chunk["content"],
            "source":     chunk["source"],
            "source_url": chunk["source_url"],
            "embedding":  embedding,
        }
    ).execute()


def clear_table(db: Client) -> None:
    """Deletes all rows so we can do a clean re-ingestion."""
    db.table(TABLE_NAME).delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    print(f"🗑️   Cleared existing rows from {TABLE_NAME}\n")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main(dry_run: bool = False, target_file: Optional[str] = None) -> None:
    if not GEMINI_API_KEY:
        print("❌  GEMINI_API_KEY is not set. Add it to your .env file.")
        sys.exit(1)
    if not SUPABASE_URL or not SUPABASE_SERVICE:
        print("❌  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set.")
        sys.exit(1)

    gemini_client = genai.Client(api_key=GEMINI_API_KEY)
    db = create_client(SUPABASE_URL, SUPABASE_SERVICE)

    if target_file:
        md_files = [KNOWLEDGE_DIR / target_file]
    else:
        md_files = sorted(KNOWLEDGE_DIR.glob("*.md"))

    if not md_files:
        print(f"❌  No .md files found in {KNOWLEDGE_DIR}")
        sys.exit(1)

    print(f"\n🐱  Purrfect Care RAG Ingestion (Gemini)")
    print(f"   Embedding : {EMBEDDING_MODEL}")
    print(f"   Files     : {len(md_files)}")
    print(f"   Dry Run   : {dry_run}\n")

    # Clear existing rows first to avoid duplicates on re-run
    if not dry_run and not target_file:
        clear_table(db)

    total_chunks = 0

    for md_file in md_files:
        print(f"📄  Processing: {md_file.name}")
        chunks = parse_markdown_file(md_file)
        print(f"   → {len(chunks)} chunks found")

        for i, chunk in enumerate(chunks):
            word_count = len(chunk["content"].split())
            print(f"   [{i+1}/{len(chunks)}] '{chunk['title']}' | {chunk['section']} | {word_count} words")

            if dry_run:
                print(f"         Preview: {chunk['content'][:120]}...")
                continue

            try:
                embedding = embed_text(gemini_client, chunk["content"])
                insert_chunk(db, chunk, embedding)
                print(f"         ✅  Stored ({len(embedding)}-dim vector)")
                time.sleep(DELAY_BETWEEN_CALLS)
            except Exception as e:
                print(f"         ❌  Error on chunk {i+1}: {e}")

        total_chunks += len(chunks)
        print()

    print(f"{'─' * 50}")
    print(f"✅  Done! {total_chunks} chunks processed.")
    if not dry_run:
        print(f"   Stored in: {TABLE_NAME}")
    print()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Purrfect Care RAG Ingestion Script")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--file", type=str, default=None)
    args = parser.parse_args()
    main(dry_run=args.dry_run, target_file=args.file)
