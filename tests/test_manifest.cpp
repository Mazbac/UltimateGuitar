#include "TestHarness.h"
#include "core/Manifest.h"
#include "core/MidiMap.h"

#include <array>
#include <filesystem>
#include <iomanip>
#include <fstream>
#include <sstream>
#include <string>

using ultimateguitar::core::Manifest;
using ultimateguitar::core::PerformanceSide;

namespace {
constexpr const char* kHeader =
    "side\tstring\tmidi\ttake\trelpath\tframes\tsha256\n";
constexpr const char* kSha0 =
    "0000000000000000000000000000000000000000000000000000000000000000";
constexpr const char* kSha1 =
    "1111111111111111111111111111111111111111111111111111111111111111";

std::filesystem::path WriteManifest(const std::string& body) {
  static int serial = 0;
  const auto path = std::filesystem::temp_directory_path() /
                    ("ug-manifest-test-" + std::to_string(++serial) + ".tsv");
  std::ofstream file(path, std::ios::binary | std::ios::trunc);
  file << kHeader << body;
  file.close();
  return path;
}
std::string Row(const char* side, int stringId, int midi, int take,
                const std::string& path, int frames, const char* sha = kSha0) {
  std::ostringstream row;
  row << side << '\t' << stringId << '\t' << midi << '\t' << take << '\t'
      << path << '\t' << frames << '\t' << sha << '\n';
  return row.str();
}


std::string Hex(const std::array<std::uint8_t, 32>& digest) {
  std::ostringstream out;
  out << std::hex << std::setfill('0');
  for (const auto byte : digest) out << std::setw(2) << static_cast<unsigned>(byte);
  return out.str();
}

struct TempManifest {
  explicit TempManifest(std::string body) : path(WriteManifest(body)) {}
  ~TempManifest() {
    std::error_code ignored;
    std::filesystem::remove(path, ignored);
  }
  std::filesystem::path path;
};
}  // namespace

UG_TEST(manifest_builds_independent_sorted_real_take_pools) {
  TempManifest file(
      Row("Right", 1, 16, 16, "Right/s1/m16/t16.wav", 100, kSha1) +
      Row("Left", 1, 16, 2, "Left/s1/m16/t02.wav", 100) +
      Row("Right", 1, 16, 1, "Right/s1/m16/t01.wav", 100) +
      Row("Left", 1, 16, 1, "Left/s1/m16/t01.wav", 100) +
      Row("Right", 1, 16, 10, "Right/s1/m16/t10.wav", 100));
  const auto manifest = Manifest::LoadTsv(file.path);
  const auto& right = manifest.Pool(PerformanceSide::Right, 16);
  const auto& left = manifest.Pool(PerformanceSide::Left, 16);
  UG_REQUIRE(right.size() == 3);
  UG_REQUIRE(right[0].take == 1);
  UG_REQUIRE(right[1].take == 10);
  UG_REQUIRE(right[2].take == 16);
  UG_REQUIRE(left.size() == 2);
  UG_REQUIRE(left[0].take == 1);
  UG_REQUIRE(left[1].take == 2);
  UG_REQUIRE(manifest.Pool(PerformanceSide::Right, 17).empty());
}

UG_TEST(manifest_rejects_invalid_identity_and_paths) {
  const std::string cases[] = {
      "Bogus\t1\t16\t1\tRight/a.wav\t100\t" + std::string(kSha0) + "\n",
      Row("Right", 5, 16, 1, "Right/a.wav", 100),
      Row("Right", 2, 16, 1, "Right/a.wav", 100),
      Row("Right", 1, 24, 1, "Right/a.wav", 100),
      Row("Right", 1, 16, 1, "../escape.wav", 100),
      Row("Right", 1, 16, 1, "C:/escape.wav", 100),
  };
  for (const auto& body : cases) {
    TempManifest file(body);
    UG_REQUIRE_THROWS(Manifest::LoadTsv(file.path));
  }
}

UG_TEST(manifest_rejects_control_bytes_in_paths) {
  const std::string embeddedNull("Right/a.wav\0hidden", 18);
  TempManifest file(Row("Right", 1, 16, 1, embeddedNull, 100));
  UG_REQUIRE_THROWS(Manifest::LoadTsv(file.path));
}

UG_TEST(manifest_rejects_bad_bounds_duplicates_and_sha) {
  const auto duplicate =
      Row("Right", 1, 16, 1, "Right/a.wav", 100) +
      Row("Right", 1, 16, 1, "Right/b.wav", 100, kSha1);
  const std::string cases[] = {
      duplicate,
      Row("Right", 1, 16, 1, "Right/a.wav", 0),
      Row("Right", 1, 16, 1, "Right/a.wav", 480001),
      Row("Right", 1, 16, 1, "Right/a.wav", 100, "badsha"),
      "Right\t1\t16\t1\tRight/a.wav\t100\n",
  };
  for (const auto& body : cases) {
    TempManifest file(body);
    UG_REQUIRE_THROWS(Manifest::LoadTsv(file.path));
  }

  TempManifest longPath(
      Row("Right", 1, 16, 1, std::string(513, 'a'), 100));
  UG_REQUIRE_THROWS(Manifest::LoadTsv(longPath.path));
}

UG_TEST(manifest_enforces_entry_limit) {
  std::string body;
  int entries = 0;
  for (const char* side : {"Left", "Right"}) {
    for (std::uint16_t midi = 0; midi < 128 && entries < 4097; ++midi) {
      const auto stringId = ultimateguitar::core::StringForMidi(static_cast<std::uint8_t>(midi));
      if (!stringId.has_value()) continue;
      for (int take = 1; take <= 64 && entries < 4097; ++take, ++entries) {
        body += Row(side, static_cast<int>(*stringId), midi, take,
                    std::string(side) + "/m" + std::to_string(midi) + "/t" + std::to_string(take) + ".wav", 100);
      }
    }
  }
  UG_REQUIRE(entries == 4097);
  TempManifest file(body);
  UG_REQUIRE_THROWS(Manifest::LoadTsv(file.path));
}
UG_TEST(manifest_digest_depends_on_exact_tsv_bytes) {
  TempManifest a(Row("Left", 1, 11, 1, "Left/a.wav", 100, kSha0));
  TempManifest b(Row("Left", 1, 11, 1, "Left/a.wav", 101, kSha0));
  TempManifest c(Row("Left", 1, 11, 1, "Left/a.wav", 100, kSha0));

  const auto ma = Manifest::LoadTsv(a.path);
  const auto mb = Manifest::LoadTsv(b.path);
  const auto mc = Manifest::LoadTsv(c.path);
  UG_REQUIRE(ma.Digest() != mb.Digest());
  UG_REQUIRE(ma.Digest() == mc.Digest());
}


UG_TEST(manifest_digest_matches_known_sha256_vector) {
  TempManifest file(Row("Right", 1, 16, 10, "audio/R/s1/m16/t10.wav", 48000, kSha0));
  const auto manifest = Manifest::LoadTsv(file.path);
  UG_REQUIRE(Hex(manifest.Digest()) == "440a5dd69fbfb62cb3fbf8e9efb3aa7504c9c0cfdd207e6b7bb81e647255ab2f");
}

UG_TEST(manifest_rejects_nonpositive_or_oversized_take_ids) {
  TempManifest zero(Row("Left", 1, 11, 0, "Left/a.wav", 100));
  TempManifest huge(Row("Left", 1, 11, 65536, "Left/a.wav", 100));
  UG_REQUIRE_THROWS(Manifest::LoadTsv(zero.path));
  UG_REQUIRE_THROWS(Manifest::LoadTsv(huge.path));
}

UG_TEST(manifest_rejects_more_than_64_samples_in_one_pool) {
  std::string body;
  for (int take = 1; take <= 65; ++take) {
    body += Row("Right", 1, 16, take,
                "Right/s1/m16/t" + std::to_string(take) + ".wav", 100);
  }
  TempManifest file(body);
  UG_REQUIRE_THROWS(Manifest::LoadTsv(file.path));
}
