#include "TestHarness.h"

#include <iostream>

int main() {
  int failures = 0;
  for (const auto& testCase : ultimateguitar::test::Registry()) {
    try {
      testCase.fn();
      std::cout << "PASS " << testCase.name << '\n';
    } catch (const std::exception& error) {
      ++failures;
      std::cerr << "FAIL " << testCase.name << ": " << error.what() << '\n';
    } catch (...) {
      ++failures;
      std::cerr << "FAIL " << testCase.name << ": unknown exception\n";
    }
  }
  return failures == 0 ? 0 : 1;
}
