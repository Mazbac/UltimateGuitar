#include <cstdint>
#include "ui/DesignTokens.h"

int main() {
  using namespace ultimateguitar::ui;
  static_assert(SignalRed == 0xFFD71920u, "SignalRed token drifted");
  static_assert(DeepRed == 0xFF8A0D12u, "DeepRed token drifted");
  static_assert(HardwareBlack == 0xFF0B0D10u, "HardwareBlack token drifted");
  static_assert(Charcoal == 0xFF171A1Fu, "Charcoal token drifted");
  static_assert(Metal == 0xFFB6BDC7u, "Metal token drifted");
  static_assert(Text == 0xFFF5F7FAu, "Text token drifted");
  return 0;
}
