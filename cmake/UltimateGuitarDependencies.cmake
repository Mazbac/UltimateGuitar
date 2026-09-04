if(NOT DEFINED IPLUG2_DIR)
  set(IPLUG2_DIR "${CMAKE_SOURCE_DIR}/.deps/iPlug2" CACHE PATH "Pinned iPlug2 checkout")
endif()

set(UG_VST3_SDK_DIR "${IPLUG2_DIR}/Dependencies/IPlug/VST3_SDK")

if(NOT EXISTS "${IPLUG2_DIR}/iPlug2.cmake")
  message(FATAL_ERROR
    "Pinned iPlug2 dependency is missing at ${IPLUG2_DIR}. "
    "Run: powershell -NoProfile -ExecutionPolicy Bypass -File scripts/bootstrap.ps1")
endif()

if(NOT EXISTS "${UG_VST3_SDK_DIR}/public.sdk")
  message(FATAL_ERROR
    "Pinned VST3 SDK dependency is missing at ${UG_VST3_SDK_DIR}. "
    "Run: powershell -NoProfile -ExecutionPolicy Bypass -File scripts/bootstrap.ps1")
endif()
