{ pkgs ? import <nixpkgs> {}, ... }:

pkgs.stdenv.mkDerivation {
  pname = "zakkir-desktop";
  version = "1.3.1";

  src = ./.;

  nativeBuildInputs = [ pkgs.makeWrapper ];

  dontBuild = true;

  installPhase = ''
    runHook preInstall

    # Install resource files
    mkdir -p $out/share/zakkir-desktop
    cp -r package.json popup.html popup.js popup.css azkar.json icon.png icon_16.png icon_48.png main.js preload.js leaflet sounds $out/share/zakkir-desktop/

    # Create the launcher script wrapping electron
    mkdir -p $out/bin
    makeWrapper ${pkgs.electron}/bin/electron $out/bin/zakkir-desktop \
      --add-flags "$out/share/zakkir-desktop/main.js"

    # Install standard icons for desktop environment integrations
    mkdir -p $out/share/icons/hicolor/128x128/apps
    cp icon.png $out/share/icons/hicolor/128x128/apps/zakkir.png
    mkdir -p $out/share/icons/hicolor/48x48/apps
    cp icon_48.png $out/share/icons/hicolor/48x48/apps/zakkir.png
    mkdir -p $out/share/icons/hicolor/16x16/apps
    cp icon_16.png $out/share/icons/hicolor/16x16/apps/zakkir.png

    # Generate the desktop menu shortcut
    mkdir -p $out/share/applications
    cat <<EOF > $out/share/applications/zakkir-desktop.desktop
[Desktop Entry]
Name=Zakkir
Comment=Prayer times + Azkar
Exec=zakkir-desktop
Icon=zakkir
Type=Application
Terminal=false
Categories=Utility;
EOF

    runHook postInstall
  '';
}
