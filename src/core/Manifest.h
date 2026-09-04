#pragma once

#include "SampleTypes.h"

#include <array>
#include <cstdint>
#include <filesystem>
#include <vector>

namespace ultimateguitar::core {

class Manifest {
 public:
  static Manifest LoadTsv(const std::filesystem::path& path);

  const std::vector<SampleRef>& Pool(PerformanceSide side, std::uint8_t midi) const noexcept;
  const std::array<std::uint8_t, 32>& Digest() const noexcept { return digest_; }

 private:
  std::array<std::array<std::vector<SampleRef>, 128>, 2> pools_{};
  std::array<std::uint8_t, 32> digest_{};
};

}  // namespace ultimateguitar::core
