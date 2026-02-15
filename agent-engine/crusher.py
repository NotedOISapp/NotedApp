"""
SmartCrusher — Context Compression Engine
Ported from Headroom's concept (chopratejas/headroom)

Three-stage pipeline:
1. Cache Aligner — Normalizes dynamic tokens (timestamps, UUIDs, IDs) 
2. Smart Crusher — Removes redundant/repetitive content, keeps critical data
3. Context Fitter — Score-based token fitting within budget
"""

import re
import hashlib
import json
from typing import Any
from dataclasses import dataclass


@dataclass
class CrushResult:
    """Result of context compression."""
    original_chars: int
    crushed_chars: int
    savings_pct: float
    content: str
    originals_hash: str  # Hash to retrieve full content if needed


class SmartCrusher:
    """Compresses LLM context while preserving critical information."""

    # Patterns that are dynamic and can be normalized for cache alignment
    DYNAMIC_PATTERNS = [
        (r'\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[.\d]*Z?\b', '[TIMESTAMP]'),  # ISO timestamps
        (r'\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b', '[UUID]'),  # UUIDs
        (r'req-\d+', '[REQ_ID]'),  # Request IDs
        (r'session_[a-zA-Z0-9]+', '[SESSION_ID]'),  # Session IDs
    ]

    # Signals that indicate critical content that must be preserved
    CRITICAL_SIGNALS = [
        'error', 'fatal', 'critical', 'fail', 'exception', 'crash',
        'warning', 'timeout', 'denied', 'unauthorized', 'rejected',
        'decision', 'approved', 'important', 'required', 'must',
    ]

    def __init__(self, max_chars: int = 4000):
        self.max_chars = max_chars
        self._originals: dict[str, str] = {}  # hash -> original content

    def crush(self, content: str | list | dict) -> CrushResult:
        """Compress content while preserving critical information."""
        # Normalize input to string
        if isinstance(content, (list, dict)):
            raw = json.dumps(content, indent=2)
        else:
            raw = str(content)

        original_chars = len(raw)

        # Stage 1: Cache Alignment — normalize dynamic tokens
        aligned = self._align_cache(raw)

        # Stage 2: Smart Crush — remove redundancy, keep critical
        crushed = self._smart_crush(aligned)

        # Stage 3: Context Fit — trim to budget if still over
        fitted = self._fit_context(crushed)

        # Store original for retrieval
        content_hash = hashlib.sha256(raw.encode()).hexdigest()[:12]
        self._originals[content_hash] = raw

        crushed_chars = len(fitted)
        savings = ((original_chars - crushed_chars) / original_chars * 100) if original_chars > 0 else 0

        return CrushResult(
            original_chars=original_chars,
            crushed_chars=crushed_chars,
            savings_pct=round(savings, 1),
            content=fitted,
            originals_hash=content_hash,
        )

    def retrieve(self, content_hash: str) -> str | None:
        """Retrieve original uncompressed content by hash."""
        return self._originals.get(content_hash)

    def _align_cache(self, text: str) -> str:
        """Stage 1: Normalize dynamic tokens for better cache hits."""
        result = text
        for pattern, replacement in self.DYNAMIC_PATTERNS:
            result = re.sub(pattern, replacement, result)
        return result

    def _smart_crush(self, text: str) -> str:
        """Stage 2: Remove redundant lines, preserve critical ones."""
        lines = text.split('\n')
        if len(lines) <= 10:
            return text  # Too short to compress

        seen_patterns: set[str] = set()
        kept_lines: list[str] = []
        skipped_count = 0

        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue

            # Always keep critical lines
            is_critical = any(signal in stripped.lower() for signal in self.CRITICAL_SIGNALS)
            if is_critical:
                if skipped_count > 0:
                    kept_lines.append(f"  [... {skipped_count} similar entries omitted ...]")
                    skipped_count = 0
                kept_lines.append(line)
                continue

            # Deduplicate similar lines (normalize numbers for comparison)
            normalized = re.sub(r'\d+', 'N', stripped)
            if normalized in seen_patterns:
                skipped_count += 1
                continue

            seen_patterns.add(normalized)
            if skipped_count > 0:
                kept_lines.append(f"  [... {skipped_count} similar entries omitted ...]")
                skipped_count = 0
            kept_lines.append(line)

        if skipped_count > 0:
            kept_lines.append(f"  [... {skipped_count} similar entries omitted ...]")

        return '\n'.join(kept_lines)

    def _fit_context(self, text: str) -> str:
        """Stage 3: Trim to fit within max_chars budget."""
        if len(text) <= self.max_chars:
            return text

        # Keep first 30% and last 20%, summarize middle
        first_cut = int(self.max_chars * 0.3)
        last_cut = int(self.max_chars * 0.2)
        middle_budget = self.max_chars - first_cut - last_cut - 50  # 50 for separator

        first = text[:first_cut]
        last = text[-last_cut:]
        middle_chars = len(text) - first_cut - last_cut

        return f"{first}\n[... {middle_chars} chars compressed ...]\n{last}"


# Singleton instance
crusher = SmartCrusher()
