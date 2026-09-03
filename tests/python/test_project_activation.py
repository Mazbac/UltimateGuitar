import json
import pathlib
import subprocess
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
POWERSHELL = "powershell.exe"


def run_ps(script: pathlib.Path, *args: str, cwd=None):
    return subprocess.run(
        [POWERSHELL, "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(script), *args],
        cwd=cwd or ROOT,
        text=True,
        capture_output=True,
        check=False,
    )


class ProjectActivationTests(unittest.TestCase):
    def test_manifest_is_project_define_without_placeholders(self):
        manifest = json.loads((ROOT / ".project" / "manifest.json").read_text(encoding="utf-8"))
        self.assertEqual(manifest["mode"], "project")
        self.assertEqual(manifest["lifecycle"], "DEFINE")
        self.assertEqual(manifest["project"]["name"], "UltimateGuitar")
        self.assertTrue(manifest["ui"]["hasUserInterface"])
        self.assertEqual(manifest["ui"]["designSystem"], "DESIGN_SYSTEM.md")
        self.assertEqual(manifest["ui"]["designTokens"], "src/ui/DesignTokens.h")
        self.assertNotIn("UNSET", json.dumps(manifest))

    def test_toolchain_check_finds_supported_visual_studio_and_cmake(self):
        result = run_ps(ROOT / "scripts" / "bootstrap-toolchain.ps1", "-CheckOnly", "-Json")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        info = json.loads(result.stdout.strip().splitlines()[-1])
        self.assertTrue(info["supported"])
        self.assertIn(int(info["visualStudioYear"]), (2019, 2022))
        major, minor, *_ = [int(x) for x in info["cmakeVersion"].split(".")]
        self.assertGreaterEqual((major, minor), (3, 14))
        self.assertTrue(pathlib.Path(info["vsDevCmd"]).is_file())

    def test_dependency_check_fails_with_actionable_bootstrap_message(self):
        tool = run_ps(ROOT / "scripts" / "bootstrap-toolchain.ps1", "-CheckOnly", "-Json")
        self.assertEqual(tool.returncode, 0, tool.stdout + tool.stderr)
        info = json.loads(tool.stdout.strip().splitlines()[-1])
        self.assertEqual(info["generator"], "Ninja")
        with tempfile.TemporaryDirectory() as tmp:
            missing = pathlib.Path(tmp) / "missing-iplug2"
            build = pathlib.Path(tmp) / "build"
            command = (
                f'call "{info["vsDevCmd"]}" -no_logo -arch=x64 && '
                f'"{info["cmake"]}" -S "{ROOT}" -B "{build}" -G Ninja '
                f'-DCMAKE_BUILD_TYPE=Debug -DCMAKE_MAKE_PROGRAM="{info["ninja"]}" '
                f'-DIPLUG2_DIR="{missing}"'
            )
            result = subprocess.run(
                command,
                shell=True, text=True, capture_output=True, check=False,
            )
        combined = result.stdout + result.stderr
        self.assertNotEqual(result.returncode, 0, combined)
        self.assertIn("scripts/bootstrap.ps1", combined)

    def test_secret_scan_catches_untracked_secret_without_echoing_it(self):
        with tempfile.TemporaryDirectory() as tmp:
            repo = pathlib.Path(tmp)
            subprocess.run(["git", "init", "-q", str(repo)], check=True)
            secret = "AKIA" + "ABCDEFGHIJKLMNOP"
            candidate = repo / "candidate.txt"
            candidate.write_text("token=" + secret + "\n", encoding="utf-8")
            result = run_ps(ROOT / "scripts" / "secret-scan.ps1", "-Root", str(repo))
            combined = result.stdout + result.stderr
            self.assertNotEqual(result.returncode, 0, combined)
            self.assertIn("candidate.txt", combined)
            self.assertIn("AWS access key", combined)
            self.assertNotIn(secret, combined)

    def test_dependency_bootstrap_restores_exact_pins(self):
        result = run_ps(ROOT / "scripts" / "bootstrap.ps1")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        iplug = ROOT / ".deps" / "iPlug2"
        vst3 = iplug / "Dependencies" / "IPlug" / "VST3_SDK"
        iplug_head = subprocess.check_output(["git", "-C", str(iplug), "rev-parse", "HEAD"], text=True).strip()
        vst3_head = subprocess.check_output(["git", "-C", str(vst3), "rev-parse", "HEAD"], text=True).strip()
        self.assertEqual(iplug_head, "d54f69050f517e43b941d88c2a170f0a840b9ee4")
        self.assertEqual(vst3_head, "3cdf9ca5d1f5b1b21e0a86832aa4abe55607bd96")

    def test_native_smoke_build_and_ctest_pass(self):
        result = run_ps(ROOT / "scripts" / "build.ps1", "-Configuration", "Debug", "-RunTests")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("100% tests passed", result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()

# Activation contract tests added after the native bootstrap/build GREEN checkpoint.
def _read(path: pathlib.Path) -> str:
    return path.read_text(encoding="utf-8")


def _activation_contract_tests():
    def test_threat_model_covers_runtime_file_trust_boundaries(self):
        text = _read(ROOT / "THREAT_MODEL.md")
        for required in ("path traversal", "malformed RIFF", "dependency drift", "worker teardown", "no network"):
            self.assertIn(required.lower(), text.lower())

    def test_quality_workflow_uses_minimal_permissions_and_pinned_actions(self):
        text = _read(ROOT / ".github" / "workflows" / "quality.yml")
        self.assertIn("contents: read", text)
        self.assertIn("actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803", text)
        self.assertIn("actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38", text)
        self.assertNotIn("actions/checkout@v", text)
        self.assertNotIn("actions/setup-node@v", text)

    def test_durable_status_matches_define_activation_and_verify_script_exists(self):
        status = _read(ROOT / "STATUS.md")
        self.assertIn("Lifecycle: DEFINE", status)
        self.assertIn("build/v0.1-implementation", status)
        verify = ROOT / "scripts" / "verify.ps1"
        self.assertTrue(verify.is_file())

    ProjectActivationTests.test_threat_model_covers_runtime_file_trust_boundaries = test_threat_model_covers_runtime_file_trust_boundaries
    ProjectActivationTests.test_quality_workflow_uses_minimal_permissions_and_pinned_actions = test_quality_workflow_uses_minimal_permissions_and_pinned_actions
    ProjectActivationTests.test_durable_status_matches_define_activation_and_verify_script_exists = test_durable_status_matches_define_activation_and_verify_script_exists

_activation_contract_tests()

def _secret_scan_regression_tests():
    def test_secret_scan_has_no_false_positive_on_project_source_or_python_cache(self):
        result = run_ps(ROOT / "scripts" / "secret-scan.ps1")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("Secret scan OK", result.stdout)

    ProjectActivationTests.test_secret_scan_has_no_false_positive_on_project_source_or_python_cache = test_secret_scan_has_no_false_positive_on_project_source_or_python_cache

_secret_scan_regression_tests()

def _warning_regression_tests():
    def test_fresh_release_build_has_no_msvc_warning_override(self):
        build_dir = ROOT / "build" / "release"
        if build_dir.exists():
            import shutil
            shutil.rmtree(build_dir)
        result = run_ps(ROOT / "scripts" / "build.ps1", "-Configuration", "Release", "-RunTests")
        combined = result.stdout + result.stderr
        self.assertEqual(result.returncode, 0, combined)
        self.assertNotIn("warning D9025", combined)

    ProjectActivationTests.test_fresh_release_build_has_no_msvc_warning_override = test_fresh_release_build_has_no_msvc_warning_override

_warning_regression_tests()


def _git_hygiene_regression_tests():
    def test_python_bytecode_is_git_ignored(self):
        ignore = (ROOT / ".gitignore").read_text(encoding="utf-8")
        self.assertIn("__pycache__/", ignore)
        self.assertIn("*.py[cod]", ignore)

    ProjectActivationTests.test_python_bytecode_is_git_ignored = test_python_bytecode_is_git_ignored

_git_hygiene_regression_tests()
