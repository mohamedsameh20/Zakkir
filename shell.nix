{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  name = "zakkir-desktop-dev";

  buildInputs = with pkgs; [
    nodejs
    electron
  ];

  shellHook = ''
    export ELECTRON_OVERRIDE_DIST_PATH="${pkgs.electron}/bin"
    echo "=========================================="
    echo "  Zakkir Desktop NixOS Environment Ready"
    echo "  Run 'npm start' or 'electron .' to launch"
    echo "=========================================="
  '';
}
