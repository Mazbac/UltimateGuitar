# Sample-library test fixtures

Task 2 tests generate tiny RIFF/WAVE files at runtime with Python stdlib.

No private guitar recordings are stored here or committed to Git. The generated fixtures cover the exact v0.1 stereo 48 kHz IEEE-float32 contract plus malformed/unsupported cases.

The real local recording bank is validated separately through `tools/library_manifest.py`; generated manifests and reports stay under ignored `build/` output.
