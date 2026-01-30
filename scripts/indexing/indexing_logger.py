"""
Structured logging for Glean indexing operations.

Provides per-document logging, progress tracking, and summary generation.
Designed to be backportable to the glean-indexing-sdk.
"""

import logging
import sys
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Protocol, TextIO


class LogLevel(Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"


@dataclass
class DocumentLogEntry:
    """Log entry for a single document."""
    url: str
    doc_type: str
    title: str
    title_length: int
    content_length: int
    status: str = "success"
    error: Optional[str] = None
    duration_ms: Optional[float] = None
    extra: Dict[str, Any] = field(default_factory=dict)


@dataclass
class IndexingSummary:
    """Summary of an indexing run."""
    total_documents: int = 0
    info_pages: int = 0
    api_references: int = 0
    successful: int = 0
    failed: int = 0
    warnings: int = 0
    total_duration_s: float = 0.0
    avg_content_length: float = 0.0
    min_content_length: int = 0
    max_content_length: int = 0
    errors: List[str] = field(default_factory=list)
    warnings_list: List[str] = field(default_factory=list)


class LogWriter(Protocol):
    """Protocol for log writers."""
    def write_line(self, message: str, level: LogLevel = LogLevel.INFO) -> None: ...
    def write_document(self, entry: DocumentLogEntry) -> None: ...
    def write_summary(self, summary: IndexingSummary) -> None: ...
    def flush(self) -> None: ...


class StdoutLogWriter:
    """Write logs to stdout in a human-readable format."""

    def __init__(self, stream: TextIO = sys.stdout, verbose: bool = False):
        self.stream = stream
        self.verbose = verbose
        self._doc_count = 0

    def write_line(self, message: str, level: LogLevel = LogLevel.INFO) -> None:
        prefix = {
            LogLevel.DEBUG: "  ",
            LogLevel.INFO: "  ",
            LogLevel.WARNING: "  [WARN] ",
            LogLevel.ERROR: "  [ERROR] ",
        }[level]
        self.stream.write(f"{prefix}{message}\n")

    def write_document(self, entry: DocumentLogEntry) -> None:
        self._doc_count += 1

        status_icon = "✓" if entry.status == "success" else "✗" if entry.status == "error" else "⚠"
        type_label = "api" if entry.doc_type == "api_reference" else "info"

        duration_str = f" ({entry.duration_ms:.0f}ms)" if entry.duration_ms else ""

        self.stream.write(
            f"  {status_icon} [{type_label:4}] {entry.url}\n"
        )

        if self.verbose or entry.status != "success":
            self.stream.write(
                f"           title: {entry.title_length:4} chars | content: {entry.content_length:6} chars{duration_str}\n"
            )

        if entry.error:
            self.stream.write(f"           error: {entry.error}\n")

        if self.verbose and entry.extra:
            for key, value in entry.extra.items():
                self.stream.write(f"           {key}: {value}\n")

    def write_summary(self, summary: IndexingSummary) -> None:
        self.stream.write("\n" + "=" * 80 + "\n")
        self.stream.write("INDEXING SUMMARY\n")
        self.stream.write("=" * 80 + "\n\n")

        self.stream.write(f"  Total documents:    {summary.total_documents}\n")
        self.stream.write(f"    - Info pages:     {summary.info_pages}\n")
        self.stream.write(f"    - API references: {summary.api_references}\n")
        self.stream.write(f"\n")
        self.stream.write(f"  Status:\n")
        self.stream.write(f"    - Successful:     {summary.successful}\n")
        self.stream.write(f"    - Failed:         {summary.failed}\n")
        self.stream.write(f"    - Warnings:       {summary.warnings}\n")
        self.stream.write(f"\n")
        self.stream.write(f"  Content stats:\n")
        self.stream.write(f"    - Avg length:     {summary.avg_content_length:,.0f} chars\n")
        self.stream.write(f"    - Min length:     {summary.min_content_length:,} chars\n")
        self.stream.write(f"    - Max length:     {summary.max_content_length:,} chars\n")
        self.stream.write(f"\n")
        self.stream.write(f"  Duration:           {summary.total_duration_s:.2f}s\n")

        if summary.errors:
            self.stream.write(f"\n  ERRORS ({len(summary.errors)}):\n")
            for error in summary.errors[:10]:
                self.stream.write(f"    - {error}\n")
            if len(summary.errors) > 10:
                self.stream.write(f"    ... and {len(summary.errors) - 10} more\n")

        if summary.warnings_list:
            self.stream.write(f"\n  WARNINGS ({len(summary.warnings_list)}):\n")
            for warning in summary.warnings_list[:10]:
                self.stream.write(f"    - {warning}\n")
            if len(summary.warnings_list) > 10:
                self.stream.write(f"    ... and {len(summary.warnings_list) - 10} more\n")

        self.stream.write("\n")

    def flush(self) -> None:
        self.stream.flush()


class JsonLogWriter:
    """Write logs as JSON lines for structured logging systems."""

    def __init__(self, stream: TextIO = sys.stdout):
        import json
        self.stream = stream
        self._json = json

    def write_line(self, message: str, level: LogLevel = LogLevel.INFO) -> None:
        entry = {
            "type": "log",
            "level": level.value,
            "message": message,
            "timestamp": time.time(),
        }
        self.stream.write(self._json.dumps(entry) + "\n")

    def write_document(self, entry: DocumentLogEntry) -> None:
        log_entry = {
            "type": "document",
            "url": entry.url,
            "doc_type": entry.doc_type,
            "title_length": entry.title_length,
            "content_length": entry.content_length,
            "status": entry.status,
            "timestamp": time.time(),
        }
        if entry.error:
            log_entry["error"] = entry.error
        if entry.duration_ms:
            log_entry["duration_ms"] = entry.duration_ms
        if entry.extra:
            log_entry["extra"] = entry.extra
        self.stream.write(self._json.dumps(log_entry) + "\n")

    def write_summary(self, summary: IndexingSummary) -> None:
        entry = {
            "type": "summary",
            "total_documents": summary.total_documents,
            "info_pages": summary.info_pages,
            "api_references": summary.api_references,
            "successful": summary.successful,
            "failed": summary.failed,
            "warnings": summary.warnings,
            "total_duration_s": summary.total_duration_s,
            "avg_content_length": summary.avg_content_length,
            "min_content_length": summary.min_content_length,
            "max_content_length": summary.max_content_length,
            "errors": summary.errors,
            "warnings_list": summary.warnings_list,
            "timestamp": time.time(),
        }
        self.stream.write(self._json.dumps(entry) + "\n")

    def flush(self) -> None:
        self.stream.flush()


class IndexingLogger:
    """
    Main logging interface for indexing operations.

    Tracks documents, collects metrics, and generates summaries.
    """

    def __init__(self, writer: Optional[LogWriter] = None, verbose: bool = False):
        self.writer = writer or StdoutLogWriter(verbose=verbose)
        self._documents: List[DocumentLogEntry] = []
        self._start_time: Optional[float] = None
        self._content_lengths: List[int] = []

    def start(self, message: str = "Starting indexing operation") -> None:
        """Mark the start of indexing."""
        self._start_time = time.time()
        self.writer.write_line(message)
        self.writer.write_line("")

    def log(self, message: str, level: LogLevel = LogLevel.INFO) -> None:
        """Log a general message."""
        self.writer.write_line(message, level)

    def log_document(
        self,
        url: str,
        doc_type: str,
        title: str,
        content_length: int,
        status: str = "success",
        error: Optional[str] = None,
        duration_ms: Optional[float] = None,
        **extra: Any,
    ) -> None:
        """Log a document being processed."""
        entry = DocumentLogEntry(
            url=url,
            doc_type=doc_type,
            title=title,
            title_length=len(title),
            content_length=content_length,
            status=status,
            error=error,
            duration_ms=duration_ms,
            extra=extra,
        )
        self._documents.append(entry)
        self._content_lengths.append(content_length)
        self.writer.write_document(entry)

    def log_warning(self, message: str) -> None:
        """Log a warning."""
        self.writer.write_line(message, LogLevel.WARNING)

    def log_error(self, message: str) -> None:
        """Log an error."""
        self.writer.write_line(message, LogLevel.ERROR)

    def finish(self) -> IndexingSummary:
        """Complete indexing and generate summary."""
        duration = time.time() - self._start_time if self._start_time else 0.0

        info_pages = sum(1 for d in self._documents if d.doc_type == "info_page")
        api_refs = sum(1 for d in self._documents if d.doc_type == "api_reference")
        successful = sum(1 for d in self._documents if d.status == "success")
        failed = sum(1 for d in self._documents if d.status == "error")
        warnings = sum(1 for d in self._documents if d.status == "warning")

        errors = [d.error for d in self._documents if d.error and d.status == "error"]
        warnings_list = [d.error for d in self._documents if d.error and d.status == "warning"]

        avg_content = sum(self._content_lengths) / len(self._content_lengths) if self._content_lengths else 0
        min_content = min(self._content_lengths) if self._content_lengths else 0
        max_content = max(self._content_lengths) if self._content_lengths else 0

        summary = IndexingSummary(
            total_documents=len(self._documents),
            info_pages=info_pages,
            api_references=api_refs,
            successful=successful,
            failed=failed,
            warnings=warnings,
            total_duration_s=duration,
            avg_content_length=avg_content,
            min_content_length=min_content,
            max_content_length=max_content,
            errors=errors,
            warnings_list=warnings_list,
        )

        self.writer.write_summary(summary)
        self.writer.flush()

        return summary


def create_logger(
    format: str = "stdout",
    verbose: bool = False,
    stream: Optional[TextIO] = None,
) -> IndexingLogger:
    """
    Factory function to create an IndexingLogger with the specified writer.

    Args:
        format: Output format - "stdout" for human-readable, "json" for structured
        verbose: Whether to include extra details in output
        stream: Output stream (defaults to sys.stdout)

    Returns:
        Configured IndexingLogger instance
    """
    stream = stream or sys.stdout

    if format == "json":
        writer = JsonLogWriter(stream=stream)
    else:
        writer = StdoutLogWriter(stream=stream, verbose=verbose)

    return IndexingLogger(writer=writer, verbose=verbose)
