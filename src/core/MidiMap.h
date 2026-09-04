#pragma once

#include "SampleTypes.h"

#include <cstdint>
#include <optional>

namespace ultimateguitar::core {

std::optional<GuitarString> StringForMidi(std::uint8_t midi) noexcept;

}  // namespace ultimateguitar::core
