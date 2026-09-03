import struct
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from tools.library_manifest import (
    midi_for_folder,
    numeric_take_ids,
    parse_wav_filename,
    scan_library,
    write_manifest,
    write_report,
)


def write_test_wav(
    path: Path,
    *,
    format_tag: int = 3,
    channels: int = 2,
    sample_rate: int = 48_000,
    bits: int = 32,
    frames: int = 3,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    block_align = channels * bits // 8
    byte_rate = sample_rate * block_align
    fmt = struct.pack(
        "<HHIIHH", format_tag, channels, sample_rate, byte_rate, block_align, bits
    )
    data = bytes(frames * block_align)
    riff_size = 4 + (8 + len(fmt)) + (8 + len(data))
    payload = (
        b"RIFF"
        + struct.pack("<I", riff_size)
        + b"WAVE"
        + b"fmt "
        + struct.pack("<I", len(fmt))
        + fmt
        + b"data"
        + struct.pack("<I", len(data))
        + data
    )
    path.write_bytes(payload)


def make_sample(
    root: Path,
    *,
    format_tag: int = 3,
    channels: int = 2,
    sample_rate: int = 48_000,
    bits: int = 32,
) -> Path:
    path = root / "Left" / "String 1" / "B Starting Note" / "L1 B Stroke Middle.wav"
    write_test_wav(
        path,
        format_tag=format_tag,
        channels=channels,
        sample_rate=sample_rate,
        bits=bits,
    )
    return path


class ManifestParsingTests(unittest.TestCase):
    def test_numeric_take_sort_and_holes_are_preserved(self):
        files = [
            "R1 E Stroke Middle.wav",
            "R10 E Stroke Middle.wav",
            "R16 E Stroke Middle.wav",
        ]
        self.assertEqual(numeric_take_ids(files, "Right", "E"), [1, 10, 16])

    def test_string_ranges_are_sparse_and_explicit(self):
        self.assertEqual(midi_for_folder(1, "B Starting Note"), 11)
        self.assertEqual(midi_for_folder(1, "b high"), 23)
        self.assertEqual(midi_for_folder(2, "E Starting Note"), 28)
        self.assertEqual(midi_for_folder(3, "A Starting Note"), 45)
        self.assertEqual(midi_for_folder(4, "D High"), 74)

    def test_all_52_folder_labels_map_to_canonical_midi(self):
        expected = {
            1: [("B Starting Note", 11), ("C", 12), ("C#", 13), ("D", 14), ("D#", 15), ("E", 16), ("F", 17), ("F#", 18), ("G", 19), ("G#", 20), ("A High", 21), ("A# High", 22), ("B High", 23)],
            2: [("E Starting Note", 28), ("F", 29), ("F#", 30), ("G", 31), ("G#", 32), ("A High", 33), ("A# High", 34), ("B High", 35), ("C High", 36), ("C# High", 37), ("D High", 38), ("D# High", 39), ("E High", 40)],
            3: [("A Starting Note", 45), ("A#", 46), ("B", 47), ("C", 48), ("C#", 49), ("D", 50), ("D#", 51), ("E", 52), ("F", 53), ("F#", 54), ("G", 55), ("G#", 56), ("A High", 57)],
            4: [("D Starting Note", 62), ("D#", 63), ("E", 64), ("F", 65), ("F#", 66), ("G", 67), ("G#", 68), ("A High", 69), ("A# High", 70), ("B High", 71), ("C High", 72), ("C# High", 73), ("D High", 74)],
        }
        self.assertEqual(sum(len(items) for items in expected.values()), 52)
        for string_number, items in expected.items():
            for folder, midi in items:
                with self.subTest(string=string_number, folder=folder):
                    self.assertEqual(midi_for_folder(string_number, folder), midi)

    def test_filename_take_parsing_matches_side_and_folder(self):
        self.assertEqual(
            parse_wav_filename("Right", "E", "R10 E Stroke Middle.wav"),
            10,
        )
        with self.assertRaises(ValueError):
            parse_wav_filename("Left", "E", "R10 E Stroke Middle.wav")
        with self.assertRaises(ValueError):
            parse_wav_filename("Right", "F", "R10 E Stroke Middle.wav")

    def test_starting_note_folder_matches_plain_filename_note(self):
        self.assertEqual(
            parse_wav_filename(
                "Left", "B Starting Note", "L3 B Stroke Middle.wav"
            ),
            3,
        )


class LegacyFilenameTests(unittest.TestCase):
    def test_known_highstroke_separator_typo_is_accepted_narrowly(self):
        self.assertEqual(
            parse_wav_filename(
                "Left", "D High", "L15 D HighStroke Middle.wav"
            ),
            15,
        )
        self.assertEqual(
            parse_wav_filename(
                "Right", "A high", "R14 A HighStroke Middle.wav"
            ),
            14,
        )
        with self.assertRaises(ValueError):
            parse_wav_filename("Left", "D", "L15 DStroke Middle.wav")

class ManifestWavTests(unittest.TestCase):
    def test_scan_accepts_exact_float_wav_contract(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            make_sample(root)
            rows = scan_library(root)

        self.assertEqual(len(rows), 1)
        row = rows[0]
        self.assertEqual(row.side, "Left")
        self.assertEqual(row.string_number, 1)
        self.assertEqual(row.midi, 11)
        self.assertEqual(row.take, 1)
        self.assertEqual(row.frames, 3)

    def test_scan_rejects_truncated_riff_with_path(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            path = make_sample(root)
            payload = path.read_bytes()
            path.write_bytes(payload[:-3])
            with self.assertRaisesRegex(ValueError, path.name):
                scan_library(root)

    def test_scan_rejects_wrong_wav_formats_with_path(self):
        cases = (
            ({"channels": 1}, "channels"),
            ({"sample_rate": 44_100}, "sample rate"),
            ({"format_tag": 1}, "IEEE float"),
        )
        for kwargs, reason in cases:
            with self.subTest(kwargs=kwargs):
                with tempfile.TemporaryDirectory() as tmp:
                    root = Path(tmp)
                    path = make_sample(root, **kwargs)
                    with self.assertRaisesRegex(ValueError, path.name):
                        scan_library(root)
                    try:
                        scan_library(root)
                    except ValueError as exc:
                        self.assertIn(reason.casefold(), str(exc).casefold())


class ManifestEmissionTests(unittest.TestCase):
    def test_manifest_is_deterministic_numeric_and_lf(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            note = root / "Left" / "String 1" / "B Starting Note"
            write_test_wav(note / "L10 B Stroke Middle.wav")
            write_test_wav(note / "L1 B Stroke Middle.wav")
            rows = scan_library(root)
            manifest = root / "manifest.tsv"
            write_manifest(rows, manifest)
            payload = manifest.read_bytes()

        self.assertNotIn(b"\r\n", payload)
        lines = payload.decode("utf-8").splitlines()
        self.assertEqual(
            lines[0],
            "side\tstring\tmidi\ttake\trelpath\tframes\tsha256",
        )
        self.assertEqual([row.take for row in rows], [1, 10])
        self.assertIn("Left/String 1/B Starting Note/L1 B Stroke Middle.wav", lines[1])
        self.assertEqual(len(rows[0].sha256), 64)

    def test_report_lists_missing_nominal_takes_without_slots(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            note = root / "Right" / "String 1" / "E"
            for take in (1, 10, 16):
                write_test_wav(note / f"R{take} E Stroke Middle.wav")
            rows = scan_library(root)
            report = root / "library-report.txt"
            write_report(rows, report)
            text = report.read_text(encoding="utf-8")

        self.assertIn("Right String 1 MIDI 16: 3 takes", text)
        self.assertIn("missing=2,3,4,5,6,7,8,9,11,12,13,14,15", text)
        self.assertNotIn("empty slot", text.casefold())

    def test_duplicate_identity_is_fatal(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            first = root / "Left" / "String 1" / "B Starting Note"
            second = root / "Left" / "String 1" / "B  Starting Note"
            write_test_wav(first / "L1 B Stroke Middle.wav")
            write_test_wav(second / "L1 B Stroke Middle.wav")
            with self.assertRaisesRegex(ValueError, "Duplicate sample identity"):
                scan_library(root)


class ManifestCliTests(unittest.TestCase):
    def _run_tool(self, root: Path, manifest: Path, report: Path):
        tool = Path(__file__).resolve().parents[2] / "tools" / "library_manifest.py"
        return subprocess.run(
            [
                sys.executable,
                str(tool),
                "--source",
                str(root),
                "--manifest",
                str(manifest),
                "--report",
                str(report),
            ],
            capture_output=True,
            text=True,
            check=False,
        )

    def test_cli_writes_manifest_and_report(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "library"
            make_sample(root)
            manifest = Path(tmp) / "out" / "manifest.tsv"
            report = Path(tmp) / "out" / "library-report.txt"
            result = self._run_tool(root, manifest, report)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertTrue(manifest.is_file())
            self.assertTrue(report.is_file())

    def test_cli_fails_before_output_on_invalid_sample(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "library"
            bad = make_sample(root, channels=1)
            manifest = Path(tmp) / "out" / "manifest.tsv"
            report = Path(tmp) / "out" / "library-report.txt"
            result = self._run_tool(root, manifest, report)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn(bad.name, result.stderr)
            self.assertFalse(manifest.exists())
            self.assertFalse(report.exists())

if __name__ == "__main__":
    unittest.main()
