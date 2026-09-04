#include "TestHarness.h"
#include "core/MidiMap.h"

#include <cstdint>

using ultimateguitar::core::GuitarString;
using ultimateguitar::core::StringForMidi;

UG_TEST(mapping_is_sparse_and_exclusive) {
  UG_REQUIRE(StringForMidi(11) == GuitarString::String1);
  UG_REQUIRE(StringForMidi(23) == GuitarString::String1);
  UG_REQUIRE(!StringForMidi(24).has_value());
  UG_REQUIRE(!StringForMidi(27).has_value());
  UG_REQUIRE(StringForMidi(28) == GuitarString::String2);
  UG_REQUIRE(StringForMidi(40) == GuitarString::String2);
  UG_REQUIRE(!StringForMidi(41).has_value());
  UG_REQUIRE(!StringForMidi(44).has_value());
  UG_REQUIRE(StringForMidi(45) == GuitarString::String3);
  UG_REQUIRE(StringForMidi(57) == GuitarString::String3);
  UG_REQUIRE(!StringForMidi(58).has_value());
  UG_REQUIRE(!StringForMidi(61).has_value());
  UG_REQUIRE(StringForMidi(62) == GuitarString::String4);
  UG_REQUIRE(StringForMidi(74) == GuitarString::String4);
  UG_REQUIRE(!StringForMidi(75).has_value());
}

UG_TEST(all_128_notes_match_the_exact_sparse_string_map) {
  int mapped = 0;
  for (std::uint16_t midi = 0; midi < 128; ++midi) {
    const auto stringId = StringForMidi(static_cast<std::uint8_t>(midi));
    const GuitarString* expected = nullptr;
    GuitarString expectedValue{};
    if (midi >= 11 && midi <= 23) expectedValue = GuitarString::String1, expected = &expectedValue;
    if (midi >= 28 && midi <= 40) expectedValue = GuitarString::String2, expected = &expectedValue;
    if (midi >= 45 && midi <= 57) expectedValue = GuitarString::String3, expected = &expectedValue;
    if (midi >= 62 && midi <= 74) expectedValue = GuitarString::String4, expected = &expectedValue;
    if (expected == nullptr) {
      UG_REQUIRE(!stringId.has_value());
    } else {
      ++mapped;
      UG_REQUIRE(stringId.has_value());
      UG_REQUIRE(*stringId == *expected);
    }
  }
  UG_REQUIRE(mapped == 52);
}
