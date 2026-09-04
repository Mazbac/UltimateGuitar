#pragma once

#include <exception>
#include <functional>
#include <sstream>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

namespace ultimateguitar::test {

struct Case {
  const char* name;
  void (*fn)();
};

inline std::vector<Case>& Registry() {
  static std::vector<Case> cases;
  return cases;
}

struct Registrar {
  Registrar(const char* name, void (*fn)()) { Registry().push_back({name, fn}); }
};

inline void Require(bool condition, const char* expression, const char* file, int line) {
  if (condition) return;
  std::ostringstream message;
  message << file << ':' << line << ": requirement failed: " << expression;
  throw std::runtime_error(message.str());
}

template <typename F>
inline void RequireThrows(F&& fn, const char* expression, const char* file, int line) {
  try {
    std::forward<F>(fn)();
  } catch (const std::exception&) {
    return;
  }
  std::ostringstream message;
  message << file << ':' << line << ": expected exception: " << expression;
  throw std::runtime_error(message.str());
}

}  // namespace ultimateguitar::test

#define UG_TEST(name) \
  static void name(); \
  static ::ultimateguitar::test::Registrar registrar_##name(#name, &name); \
  static void name()

#define UG_REQUIRE(expr) \
  ::ultimateguitar::test::Require(static_cast<bool>(expr), #expr, __FILE__, __LINE__)

#define UG_REQUIRE_THROWS(expr) \
  ::ultimateguitar::test::RequireThrows([&]() { (void)(expr); }, #expr, __FILE__, __LINE__)
