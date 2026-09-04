#include "MidiMap.h"

#include <array>

namespace ultimateguitar::core {
namespace {
struct MidiRange {
  std::uint8_t first;
  std::uint8_t last;
  GuitarString stringId;
};

constexpr std::array<MidiRange, 4> kRanges{{
    {11, 23, GuitarString::String1},
    {28, 40, GuitarString::String2},
    {45, 57, GuitarString::String3},
    {62, 74, GuitarString::String4},
}};
}  // namespace

std::optional<GuitarString> StringForMidi(std::uint8_t midi) noexcept {
  for (const auto& range : kRanges) {
    if (midi >= range.first && midi <= range.last) return range.stringId;
  }
  return std::nullopt;
}

}  // namespace ultimateguitar::core
