#include "Manifest.h"

#include "MidiMap.h"

#include <algorithm>
#include <array>
#include <charconv>
#include <cstddef>
#include <cstdint>
#include <fstream>
#include <set>
#include <stdexcept>
#include <string>
#include <string_view>
#include <tuple>
#include <vector>

namespace ultimateguitar::core {
namespace {

constexpr std::string_view kHeader = "side\tstring\tmidi\ttake\trelpath\tframes\tsha256";
constexpr std::size_t kMaxEntries = 4096;
constexpr std::size_t kMaxPoolEntries = 64;
constexpr std::size_t kMaxPathBytes = 512;
constexpr std::uint64_t kMaxFrames = 480000;
constexpr std::size_t kMaxManifestBytes = 4 * 1024 * 1024;

std::uint32_t RotateRight(std::uint32_t value, unsigned bits) {
  return (value >> bits) | (value << (32U - bits));
}

std::array<std::uint8_t, 32> Sha256(std::string_view bytes) {
  static constexpr std::array<std::uint32_t, 64> k{{
      0x428a2f98u, 0x71374491u, 0xb5c0fbcfu, 0xe9b5dba5u, 0x3956c25bu, 0x59f111f1u,
      0x923f82a4u, 0xab1c5ed5u, 0xd807aa98u, 0x12835b01u, 0x243185beu, 0x550c7dc3u,
      0x72be5d74u, 0x80deb1feu, 0x9bdc06a7u, 0xc19bf174u, 0xe49b69c1u, 0xefbe4786u,
      0x0fc19dc6u, 0x240ca1ccu, 0x2de92c6fu, 0x4a7484aau, 0x5cb0a9dcu, 0x76f988dau,
      0x983e5152u, 0xa831c66du, 0xb00327c8u, 0xbf597fc7u, 0xc6e00bf3u, 0xd5a79147u,
      0x06ca6351u, 0x14292967u, 0x27b70a85u, 0x2e1b2138u, 0x4d2c6dfcu, 0x53380d13u,
      0x650a7354u, 0x766a0abbu, 0x81c2c92eu, 0x92722c85u, 0xa2bfe8a1u, 0xa81a664bu,
      0xc24b8b70u, 0xc76c51a3u, 0xd192e819u, 0xd6990624u, 0xf40e3585u, 0x106aa070u,
      0x19a4c116u, 0x1e376c08u, 0x2748774cu, 0x34b0bcb5u, 0x391c0cb3u, 0x4ed8aa4au,
      0x5b9cca4fu, 0x682e6ff3u, 0x748f82eeu, 0x78a5636fu, 0x84c87814u, 0x8cc70208u,
      0x90befffau, 0xa4506cebu, 0xbef9a3f7u, 0xc67178f2u,
  }};

  std::vector<std::uint8_t> data(bytes.begin(), bytes.end());
  const std::uint64_t bitLength = static_cast<std::uint64_t>(data.size()) * 8U;
  data.push_back(0x80u);
  while ((data.size() % 64U) != 56U) data.push_back(0u);
  for (int shift = 56; shift >= 0; shift -= 8) {
    data.push_back(static_cast<std::uint8_t>((bitLength >> shift) & 0xffU));
  }

  std::array<std::uint32_t, 8> state{{
      0x6a09e667u, 0xbb67ae85u, 0x3c6ef372u, 0xa54ff53au,
      0x510e527fu, 0x9b05688cu, 0x1f83d9abu, 0x5be0cd19u,
  }};

  for (std::size_t offset = 0; offset < data.size(); offset += 64U) {
    std::array<std::uint32_t, 64> w{};
    for (std::size_t i = 0; i < 16; ++i) {
      const std::size_t p = offset + i * 4U;
      w[i] = (static_cast<std::uint32_t>(data[p]) << 24U) |
             (static_cast<std::uint32_t>(data[p + 1]) << 16U) |
             (static_cast<std::uint32_t>(data[p + 2]) << 8U) |
             static_cast<std::uint32_t>(data[p + 3]);
    }
    for (std::size_t i = 16; i < 64; ++i) {
      const auto s0 = RotateRight(w[i - 15], 7) ^ RotateRight(w[i - 15], 18) ^ (w[i - 15] >> 3U);
      const auto s1 = RotateRight(w[i - 2], 17) ^ RotateRight(w[i - 2], 19) ^ (w[i - 2] >> 10U);
      w[i] = w[i - 16] + s0 + w[i - 7] + s1;
    }

    auto a = state[0]; auto b = state[1]; auto c = state[2]; auto d = state[3];
    auto e = state[4]; auto f = state[5]; auto g = state[6]; auto h = state[7];
    for (std::size_t i = 0; i < 64; ++i) {
      const auto s1 = RotateRight(e, 6) ^ RotateRight(e, 11) ^ RotateRight(e, 25);
      const auto ch = (e & f) ^ ((~e) & g);
      const auto temp1 = h + s1 + ch + k[i] + w[i];
      const auto s0 = RotateRight(a, 2) ^ RotateRight(a, 13) ^ RotateRight(a, 22);
      const auto maj = (a & b) ^ (a & c) ^ (b & c);
      const auto temp2 = s0 + maj;
      h = g; g = f; f = e; e = d + temp1; d = c; c = b; b = a; a = temp1 + temp2;
    }
    state[0] += a; state[1] += b; state[2] += c; state[3] += d;
    state[4] += e; state[5] += f; state[6] += g; state[7] += h;
  }

  std::array<std::uint8_t, 32> digest{};
  for (std::size_t i = 0; i < state.size(); ++i) {
    digest[i * 4] = static_cast<std::uint8_t>(state[i] >> 24U);
    digest[i * 4 + 1] = static_cast<std::uint8_t>(state[i] >> 16U);
    digest[i * 4 + 2] = static_cast<std::uint8_t>(state[i] >> 8U);
    digest[i * 4 + 3] = static_cast<std::uint8_t>(state[i]);
  }
  return digest;
}

std::vector<std::string_view> SplitTabs(std::string_view line) {
  std::vector<std::string_view> fields;
  std::size_t start = 0;
  while (true) {
    const auto pos = line.find('\t', start);
    if (pos == std::string_view::npos) {
      fields.push_back(line.substr(start));
      return fields;
    }
    fields.push_back(line.substr(start, pos - start));
    start = pos + 1;
  }
}

template <typename T>
T ParseUnsigned(std::string_view value, const char* field) {
  if (value.empty()) throw std::runtime_error(std::string("Empty ") + field);
  T result{};
  const auto parsed = std::from_chars(value.data(), value.data() + value.size(), result);
  if (parsed.ec != std::errc{} || parsed.ptr != value.data() + value.size()) {
    throw std::runtime_error(std::string("Invalid ") + field);
  }
  return result;
}

PerformanceSide ParseSide(std::string_view value) {
  if (value == "Left") return PerformanceSide::Left;
  if (value == "Right") return PerformanceSide::Right;
  throw std::runtime_error("Invalid performance side");
}

GuitarString ParseString(std::string_view value) {
  const auto raw = ParseUnsigned<unsigned>(value, "string");
  if (raw < 1 || raw > 4) throw std::runtime_error("Invalid guitar string");
  return static_cast<GuitarString>(raw);
}

std::uint8_t HexNibble(char value) {
  if (value >= '0' && value <= '9') return static_cast<std::uint8_t>(value - '0');
  if (value >= 'a' && value <= 'f') return static_cast<std::uint8_t>(10 + value - 'a');
  if (value >= 'A' && value <= 'F') return static_cast<std::uint8_t>(10 + value - 'A');
  throw std::runtime_error("Malformed SHA-256");
}

std::array<std::uint8_t, 32> ParseSha(std::string_view value) {
  if (value.size() != 64) throw std::runtime_error("Malformed SHA-256");
  std::array<std::uint8_t, 32> result{};
  for (std::size_t i = 0; i < result.size(); ++i) {
    result[i] = static_cast<std::uint8_t>((HexNibble(value[i * 2]) << 4U) | HexNibble(value[i * 2 + 1]));
  }
  return result;
}

bool SafeRelativePath(std::string_view path) {
  if (path.empty() || path.size() > kMaxPathBytes) return false;
  for (const unsigned char byte : path) {
    if (byte < 0x20u || byte == 0x7fu) return false;
  }
  if (path.front() == '/' || path.front() == '\\' || path.back() == '/') return false;
  if (path.find('\\') != std::string_view::npos || path.find(':') != std::string_view::npos) return false;
  std::size_t start = 0;
  while (start <= path.size()) {
    const auto slash = path.find('/', start);
    const auto end = slash == std::string_view::npos ? path.size() : slash;
    const auto part = path.substr(start, end - start);
    if (part.empty() || part == "." || part == "..") return false;
    if (slash == std::string_view::npos) break;
    start = slash + 1;
  }
  return true;
}

std::size_t SideIndex(PerformanceSide side) {
  return side == PerformanceSide::Left ? 0U : 1U;
}

}  // namespace

Manifest Manifest::LoadTsv(const std::filesystem::path& path) {
  std::ifstream input(path, std::ios::binary | std::ios::ate);
  if (!input) throw std::runtime_error("Unable to open manifest");
  const auto end = input.tellg();
  if (end < 0 || static_cast<std::uint64_t>(end) > kMaxManifestBytes) {
    throw std::runtime_error("Manifest size is invalid");
  }
  std::string bytes(static_cast<std::size_t>(end), '\0');
  input.seekg(0);
  if (!bytes.empty() && !input.read(bytes.data(), static_cast<std::streamsize>(bytes.size()))) {
    throw std::runtime_error("Unable to read manifest");
  }

  Manifest manifest;
  manifest.digest_ = Sha256(bytes);

  const auto firstNewline = bytes.find('\n');
  if (firstNewline == std::string::npos || std::string_view(bytes.data(), firstNewline) != kHeader) {
    throw std::runtime_error("Invalid manifest header");
  }

  std::set<std::tuple<std::size_t, std::uint8_t, std::uint16_t>> identities;
  std::size_t rowCount = 0;
  std::size_t start = firstNewline + 1;
  while (start < bytes.size()) {
    const auto newline = bytes.find('\n', start);
    if (newline == std::string::npos) throw std::runtime_error("Manifest must use LF-terminated rows");
    if (newline == start) throw std::runtime_error("Empty manifest row");
    const std::string_view line(bytes.data() + start, newline - start);
    const auto fields = SplitTabs(line);
    if (fields.size() != 7) throw std::runtime_error("Manifest row must have 7 columns");

    ++rowCount;
    if (rowCount > kMaxEntries) throw std::runtime_error("Manifest has too many entries");

    const auto side = ParseSide(fields[0]);
    const auto stringId = ParseString(fields[1]);
    const auto midiRaw = ParseUnsigned<unsigned>(fields[2], "midi");
    if (midiRaw > 127) throw std::runtime_error("Invalid MIDI note");
    const auto midi = static_cast<std::uint8_t>(midiRaw);
    const auto mapped = StringForMidi(midi);
    if (!mapped.has_value() || *mapped != stringId) throw std::runtime_error("MIDI/string mapping mismatch");

    const auto takeRaw = ParseUnsigned<unsigned>(fields[3], "take");
    if (takeRaw == 0 || takeRaw > 65535) throw std::runtime_error("Invalid take id");
    const auto take = static_cast<std::uint16_t>(takeRaw);
    if (!SafeRelativePath(fields[4])) throw std::runtime_error("Unsafe sample path");
    const auto frames = ParseUnsigned<std::uint64_t>(fields[5], "frames");
    if (frames == 0 || frames > kMaxFrames) throw std::runtime_error("Invalid frame count");
    const auto sha = ParseSha(fields[6]);

    const auto sideIndex = SideIndex(side);
    if (!identities.emplace(sideIndex, midi, take).second) throw std::runtime_error("Duplicate sample identity");

    auto& pool = manifest.pools_[sideIndex][midi];
    if (pool.size() >= kMaxPoolEntries) throw std::runtime_error("Sample pool has too many entries");
    pool.push_back(SampleRef{
        side, stringId, midi, take, std::string(fields[4]), frames, sha,
    });
    start = newline + 1;
  }

  for (auto& sidePools : manifest.pools_) {
    for (auto& pool : sidePools) {
      std::sort(pool.begin(), pool.end(), [](const SampleRef& a, const SampleRef& b) { return a.take < b.take; });
    }
  }
  return manifest;
}

const std::vector<SampleRef>& Manifest::Pool(PerformanceSide side, std::uint8_t midi) const noexcept {
  static const std::vector<SampleRef> kEmpty;
  if (midi >= 128) return kEmpty;
  return pools_[SideIndex(side)][midi];
}

}  // namespace ultimateguitar::core
