# Zakkir Desktop

Mini desktop app for prayer times and Azkar.

## Installation

Download the latest release from the [Releases](https://github.com/mohamedsameh20/Zakkir/releases) page.

**Windows**

Run `Zakkir Setup 1.1.0.exe`. The installer will add the app to your Start Menu and desktop.

**Debian / Ubuntu**

```bash
sudo dpkg -i zakkir-desktop_1.1.0_amd64.deb
```

**Other Linux (AppImage)**

```bash
chmod +x Zakkir-1.1.0.AppImage
./Zakkir-1.1.0.AppImage
```

**NixOS**

```nix
home.packages = [ pkgs.callPackage ./pkgs/zakkir-desktop { } ];
```

---

## Screenshots

### Home Dashboard

|                     Light Theme                      |                     Dark Slate Theme                      |                     Dark Navy Theme                     |
| :--------------------------------------------------: | :-------------------------------------------------------: | :-----------------------------------------------------: |
| ![Home Light](Screenshots/Screenshot_Light_Home.png) | ![Home Dark Slate](Screenshots/Screenshot_Slate_Home.png) | ![Home Dark Navy](Screenshots/Screenshot_Navy_Home.png) |

### Azkar & Supplications

|                         Warm Theme (Orange)                         |                      Warm Theme (Burgundy)                      |                      Dark Theme (Green)                      |
| :-----------------------------------------------------------------: | :-------------------------------------------------------------: | :----------------------------------------------------------: |
| ![Azkar Warm Orange](Screenshots/Screenshot_Warm_Morning_Azkar.png) | ![Dua Warm Burgundy](Screenshots/Screenshot_Warm_Quran_Dua.png) | ![Dua Dark Green](Screenshots/Screenshot_Dark_Quran_Dua.png) |

|                   Dark Navy Theme (Blue)                    |                       Dark Slate Theme (Mint)                       |
| :---------------------------------------------------------: | :-----------------------------------------------------------------: |
| ![Dua Navy Blue](Screenshots/Screenshot_Navy_Quran_Dua.png) | ![Azkar Slate Mint](Screenshots/Screenshot_Slate_Evening_Azkar.png) |

### Settings & Configuration

|                           Fonts                            |                              Themes                              |
| :--------------------------------------------------------: | :--------------------------------------------------------------: |
| ![Settings Dark](Screenshots/Screenshot_Dark_Settings.png) | ![Settings Full](Screenshots/Screenshot_Slate_Settings_Full.png) |

### Responsive Scaling

|                           Wide Layout                            |
| :--------------------------------------------------------------: |
| ![Settings Wide](Screenshots/Screenshot_Light_Settings_Wide.png) |
