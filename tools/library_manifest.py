from __future__ import annotations

import argparse
import hashlib
import re
import struct
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


_FOLDER_MIDI = {
    1: {
        "b starting note": 11, "c": 12, "c#": 13, "d": 14,
        "d#": 15, "e": 16, "f": 17, "f#": 18, "g": 19,
        "g#": 20, "a high": 21, "a# high": 22, "b high": 23,
    },
    2: {
        "e starting note": 28, "f": 29, "f#": 30, "g": 31,
        "g#": 32, "a high": 33, "a# high": 34, "b high": 35,
        "c high": 36, "c# high": 37, "d high": 38,
        "d# high": 39, "e high": 40,
    },
    3: {
        "a starting note": 45, "a#": 46, "b": 47, "c": 48,
        "c#": 49, "d": 50, "d#": 51, "e": 52, "f": 53,
        "f#": 54, "g": 55, "g#": 56, "a high": 57,
    },
}

_FOLDER_MIDI[4] = {
    "d starting note": 62, "d#": 63, "e": 64, "f": 65,
    "f#": 66, "g": 67, "g#": 68, "a high": 69,
    "a# high": 70, "b high": 71, "c high": 72,
    "c# high": 73, "d high": 74,
}

_FILENAME_RE = re.compile(
    r"^(L|R)([1-9][0-9]*) ([A-G](?:#)?)(?:( High) ?Stroke| Stroke) Middle\.wav$",
    re.IGNORECASE,
)


def _normalize_label(value: str) -> str:
    return " ".join(value.strip().casefold().split())


def midi_for_folder(string_number: int, folder_name: str) -> int:
    try:
        return _FOLDER_MIDI[string_number][_normalize_label(folder_name)]
    except (KeyError, TypeError) as exc:
        raise ValueError(
            f"Unsupported folder for String {string_number}: {folder_name!r}"
        ) from exc

def _expected_filename_note(folder_name: str) -> str:
    label = _normalize_label(folder_name)
    if label.endswith(" starting note"):
        label = label.removesuffix(" starting note")
    return label


def parse_wav_filename(side: str, folder_name: str, filename: str) -> int:
    match = _FILENAME_RE.fullmatch(filename)
    if match is None:
        raise ValueError(f"Invalid sample filename: {filename!r}")

    expected_side = {"left": "l", "right": "r"}.get(_normalize_label(side))
    if expected_side is None or match.group(1).casefold() != expected_side:
        raise ValueError(f"Filename side does not match {side!r}: {filename!r}")

    actual_note = _normalize_label(match.group(3) + (match.group(4) or ""))
    if actual_note != _expected_filename_note(folder_name):
        raise ValueError(f"Filename note does not match {folder_name!r}: {filename!r}")
    return int(match.group(2))


def numeric_take_ids(
    filenames: Iterable[str], side: str, folder_name: str
) -> list[int]:
    return sorted(parse_wav_filename(side, folder_name, name) for name in filenames)


@dataclass(frozen=True)
class ManifestRow:
    side: str
    string_number: int
    midi: int
    take: int
    relpath: str
    frames: int
    sha256: str


def _wav_error(path: Path, message: str) -> ValueError:
    return ValueError(f"{path}: {message}")


def _read_wav_frames(path: Path, payload: bytes) -> int:
    if len(payload) < 12 or payload[:4] != b"RIFF" or payload[8:12] != b"WAVE":
        raise _wav_error(path, "not a RIFF/WAVE file")
    declared_size = struct.unpack_from("<I", payload, 4)[0] + 8
    if declared_size > len(payload):
        raise _wav_error(path, "truncated RIFF payload")

    fmt = None
    data_size = None
    offset = 12
    while offset + 8 <= declared_size:
        chunk_id = payload[offset : offset + 4]
        chunk_size = struct.unpack_from("<I", payload, offset + 4)[0]
        chunk_start = offset + 8
        chunk_end = chunk_start + chunk_size
        if chunk_end > declared_size or chunk_end > len(payload):
            raise _wav_error(path, "truncated RIFF chunk")
        if chunk_id == b"fmt " and fmt is None:
            if chunk_size < 16:
                raise _wav_error(path, "fmt chunk is too short")
            fmt = struct.unpack_from("<HHIIHH", payload, chunk_start)
        elif chunk_id == b"data" and data_size is None:
            data_size = chunk_size
        offset = chunk_end + (chunk_size & 1)

    if fmt is None or data_size is None:
        raise _wav_error(path, "missing fmt or data chunk")
    format_tag, channels, sample_rate, byte_rate, block_align, bits = fmt
    if format_tag != 3:
        raise _wav_error(path, f"expected IEEE float format tag 3, got {format_tag}")
    if channels != 2:
        raise _wav_error(path, f"expected 2 channels, got {channels}")
    if sample_rate != 48_000:
        raise _wav_error(path, f"expected sample rate 48000, got {sample_rate}")
    if bits != 32:
        raise _wav_error(path, f"expected 32 bits, got {bits}")
    if block_align != 8:
        raise _wav_error(path, f"expected block align 8, got {block_align}")
    if byte_rate != sample_rate * block_align:
        raise _wav_error(path, "invalid byte rate")
    if data_size % block_align:
        raise _wav_error(path, "data chunk is not frame-aligned")
    return data_size // block_align


def _string_number(path: Path) -> int:
    match = re.fullmatch(r"String ([1-4])", path.name, re.IGNORECASE)
    if match is None:
        raise ValueError(f"Unsupported string directory: {path}")
    return int(match.group(1))


def scan_library(source: Path) -> list[ManifestRow]:
    source = Path(source)
    if not source.is_dir():
        raise ValueError(f"Sample source does not exist: {source}")

    rows: list[ManifestRow] = []
    identities: set[tuple[str, int, int, int]] = set()
    for side in ("Left", "Right"):
        side_root = source / side
        if not side_root.is_dir():
            continue
        for string_root in sorted(side_root.iterdir(), key=lambda p: p.name.casefold()):
            if not string_root.is_dir():
                continue
            string_number = _string_number(string_root)
            for note_root in sorted(string_root.iterdir(), key=lambda p: p.name.casefold()):
                if not note_root.is_dir():
                    continue
                midi = midi_for_folder(string_number, note_root.name)
                for wav_path in sorted(note_root.glob("*.wav"), key=lambda p: p.name.casefold()):
                    take = parse_wav_filename(side, note_root.name, wav_path.name)
                    identity = (side, string_number, midi, take)
                    if identity in identities:
                        raise ValueError(f"Duplicate sample identity {identity}: {wav_path}")
                    payload = wav_path.read_bytes()
                    frames = _read_wav_frames(wav_path, payload)
                    identities.add(identity)
                    rows.append(
                        ManifestRow(
                            side=side,
                            string_number=string_number,
                            midi=midi,
                            take=take,
                            relpath=wav_path.relative_to(source).as_posix(),
                            frames=frames,
                            sha256=hashlib.sha256(payload).hexdigest(),
                        )
                    )
    rows.sort(key=lambda row: (row.side, row.string_number, row.midi, row.take))
    return rows

def write_manifest(rows: Iterable[ManifestRow], path: Path) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    ordered = sorted(
        rows,
        key=lambda row: (row.side, row.string_number, row.midi, row.take),
    )
    lines = ["side\tstring\tmidi\ttake\trelpath\tframes\tsha256"]
    for row in ordered:
        lines.append(
            f"{row.side}\t{row.string_number}\t{row.midi}\t{row.take}\t"
            f"{row.relpath}\t{row.frames}\t{row.sha256}"
        )
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write("\n".join(lines) + "\n")


def _pool_key(row: ManifestRow) -> tuple[str, int, int]:
    return row.side, row.string_number, row.midi


def write_report(rows: Iterable[ManifestRow], path: Path) -> None:
    ordered = sorted(rows, key=lambda row: (*_pool_key(row), row.take))
    pools: dict[tuple[str, int, int], list[int]] = {}
    for row in ordered:
        pools.setdefault(_pool_key(row), []).append(row.take)

    lines = [
        "UltimateGuitar sample-library report",
        f"samples={len(ordered)}",
        f"pools={len(pools)}",
        "format=stereo 48000 Hz IEEE-float32",
    ]
    for (side, string_number, midi), takes in sorted(pools.items()):
        present = set(takes)
        missing = [take for take in range(1, 17) if take not in present]
        missing_text = ",".join(str(take) for take in missing) if missing else "none"
        lines.append(
            f"{side} String {string_number} MIDI {midi}: {len(takes)} takes; "
            f"missing={missing_text}"
        )

    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write("\n".join(lines) + "\n")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Validate UltimateGuitar raw WAVs and emit a stable manifest."
    )
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    args = parser.parse_args(argv)

    try:
        rows = scan_library(args.source)
    except ValueError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    write_manifest(rows, args.manifest)
    write_report(rows, args.report)
    print(f"Validated {len(rows)} samples.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
