{ pkgs ? import <nixpkgs> { } }:

# Android development shell for the Zakkir mobile app.
#
# This deliberately reuses the Android SDK already installed under
# $ANDROID_SDK_HOME (default ~/Android/Sdk) rather than pulling a second copy
# through androidenv, because the installed SDK already matches what Expo 53
# asks for: build-tools 35.0.0, platform android-35, NDK 27.1.12297006.
#
# NixOS notes:
#   * The SDK ships prebuilt ELF binaries linked against /lib64/ld-linux.
#     They run here because the host enables programs.nix-ld, and we extend
#     NIX_LD_LIBRARY_PATH below with the libraries the NDK toolchain wants.
#   * Three build-tools entries (d8, apksigner, lld) are shell scripts with a
#     hardcoded #!/bin/bash, which does not exist on NixOS. The shellHook
#     rewrites them to #!/usr/bin/env bash. Gradle normally calls the matching
#     .jar directly, so this only matters when invoking them by hand, but the
#     fix is idempotent and cheap.

let
  jdk = pkgs.jdk17;

  # Libraries the NDK's prebuilt clang/lld and other SDK binaries dlopen.
  ldLibraries = with pkgs; [
    stdenv.cc.cc.lib
    zlib
    ncurses5
    libxml2
    openssl
    # The bundled qemu that backs `emulator` needs an X11/GL/image stack. These
    # are only reachable through nix-ld, since the binary is prebuilt.
    libpng
    libjpeg
    libGL
    libdrm
    xorg.libX11
    xorg.libXext
    xorg.libXi
    xorg.libXcursor
    xorg.libXrandr
    xorg.libxcb
    xorg.libXfixes
    xorg.libXrender
    xorg.libxkbfile
    xorg.libXtst
    xorg.libXinerama
    xorg.libSM
    xorg.libICE
    libxkbcommon
    libbsd
    libunwind
    libpulseaudio
    dbus
    fontconfig
    freetype
    expat
    nss
    nspr
    alsa-lib
  ];
in
pkgs.mkShell {
  name = "zakkir-android-dev";

  buildInputs = [
    jdk
    # Pinned to match the host toolchain and CI rather than following the
    # nixpkgs default, which drifts ahead of what React Native supports.
    pkgs.nodejs_22
    # Gradle comes from the project's own wrapper (8.13) so the build matches
    # CI exactly; gradle is here only for `gradle --version` style debugging.
    pkgs.android-tools # adb / fastboot that are actually linked for NixOS
    pkgs.cmake
    pkgs.ninja
    pkgs.unzip
    pkgs.git
  ];

  shellHook = ''
    export JAVA_HOME="${jdk}"

    export ANDROID_SDK_ROOT="''${ANDROID_SDK_ROOT:-$HOME/Android/Sdk}"
    export ANDROID_HOME="$ANDROID_SDK_ROOT"

    if [ ! -d "$ANDROID_SDK_ROOT" ]; then
      echo "!! Android SDK not found at $ANDROID_SDK_ROOT"
      echo "   Set ANDROID_SDK_ROOT to your SDK location and re-enter the shell."
      return 1 2>/dev/null || exit 1
    fi

    export ANDROID_NDK_ROOT="$ANDROID_SDK_ROOT/ndk/27.1.12297006"
    export ANDROID_NDK_HOME="$ANDROID_NDK_ROOT"

    export PATH="$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/emulator:$PATH"

    # Let nix-ld satisfy the prebuilt SDK/NDK binaries.
    export NIX_LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath ldLibraries}''${NIX_LD_LIBRARY_PATH:+:$NIX_LD_LIBRARY_PATH}"

    # The emulator's bundled qemu resolves its X11/GL/image deps through the
    # normal loader path, not nix-ld, so it needs LD_LIBRARY_PATH as well.
    export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath ldLibraries}''${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"

    # Gradle writes local.properties on prebuild; keep it pointed at this SDK.
    if [ -d android ]; then
      printf 'sdk.dir=%s\n' "$ANDROID_SDK_ROOT" > android/local.properties
    fi

    # Repair the /bin/bash shebangs that NixOS cannot execute.
    for _tool in d8 apksigner lld; do
      for _path in "$ANDROID_SDK_ROOT"/build-tools/*/"$_tool"; do
        [ -f "$_path" ] || continue
        if head -1 "$_path" | grep -q '^#!/bin/bash$'; then
          sed -i '1s|^#!/bin/bash$|#!/usr/bin/env bash|' "$_path" \
            && echo "   patched shebang: $_path"
        fi
      done
    done
    unset _tool _path

    echo "=================================================="
    echo "  Zakkir Android environment ready"
    echo "  JDK        $(java -version 2>&1 | head -1)"
    echo "  SDK        $ANDROID_SDK_ROOT"
    echo "  Node       $(node --version)"
    echo ""
    echo "  npm install              install JS dependencies"
    echo "  npm run generate-renderer rebuild the WebView bundle"
    echo "  npm run build:apk        assemble a release APK"
    echo "  npm run android          run on a device/emulator"
    echo "=================================================="
  '';
}
