cmake_minimum_required(VERSION 3.14)
project(UltimateGuitar VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

if(MSVC)
  string(REGEX REPLACE "/W[0-4]" "/W4" CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS}")
endif()

include(cmake/UltimateGuitarDependencies.cmake)

enable_testing()
find_package(Python3 COMPONENTS Interpreter REQUIRED)
add_test(
  NAME library-manifest-python
  COMMAND ${Python3_EXECUTABLE} -m unittest tests.python.test_library_manifest -v
)
set_tests_properties(library-manifest-python PROPERTIES
  WORKING_DIRECTORY "${CMAKE_SOURCE_DIR}"
)
add_executable(UltimateGuitarCoreTests
  tests/native/TestSmoke.cpp
)
target_include_directories(UltimateGuitarCoreTests PRIVATE src)

if(MSVC)
  target_compile_options(UltimateGuitarCoreTests PRIVATE /WX)
else()
  target_compile_options(UltimateGuitarCoreTests PRIVATE -Wall -Wextra -Wpedantic -Werror)
endif()

add_test(NAME core-smoke COMMAND UltimateGuitarCoreTests)

add_library(UltimateGuitarCore STATIC
  src/core/MidiMap.cpp
  src/core/Manifest.cpp
)
target_include_directories(UltimateGuitarCore PUBLIC src)

add_executable(UltimateGuitarDomainTests
  tests/TestMain.cpp
  tests/test_mapping.cpp
  tests/test_manifest.cpp
)
target_include_directories(UltimateGuitarDomainTests PRIVATE tests)
target_link_libraries(UltimateGuitarDomainTests PRIVATE UltimateGuitarCore)

if(MSVC)
  target_compile_options(UltimateGuitarCore PRIVATE /WX)
  target_compile_options(UltimateGuitarDomainTests PRIVATE /WX)
else()
  target_compile_options(UltimateGuitarCore PRIVATE -Wall -Wextra -Wpedantic -Werror)
  target_compile_options(UltimateGuitarDomainTests PRIVATE -Wall -Wextra -Wpedantic -Werror)
endif()
add_test(NAME core-domain COMMAND UltimateGuitarDomainTests)
