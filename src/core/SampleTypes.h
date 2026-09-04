#pragma once

#include <array>
#include <cstdint>
#include <string>

namespace ultimateguitar::core {

enum class PerformanceSide : std::uint8_t { Left, Right };
enum class GuitarString : std::uint8_t { String1 = 1, String2, String3, String4 };

struct SampleRef {
  PerformanceSide side{};
  GuitarString stringId{};
  std::uint8_t midi{};
  std::uint16_t take{};
  std::string relativePath;
  std::uint64_t frames{};
  std::array<std::uint8_t, 32> sha256{};
};

}  // namespace ultimateguitar::core
