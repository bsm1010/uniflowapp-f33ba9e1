; ============================================================
; Fennecly Custom Installer Script
; Place this file at: installer-assets/installer.nsh
; ============================================================

; ------ Custom Welcome Page ------
!macro customHeader
  !system "echo Building Fennecly Installer..."
!macroend

!macro customInit
  ; Custom initialization — check OS version
  ${If} ${AtLeastWin10}
    ; OK
  ${Else}
    MessageBox MB_OK|MB_ICONEXCLAMATION "Fennecly requires Windows 10 or later."
    Abort
  ${EndIf}
!macroend

!macro customInstall
  ; ---- Custom page: Write install timestamp ----
  WriteRegStr HKCU "Software\Fennecly" "InstallDate" "$LOCALAPPDATA\Fennecly"
  WriteRegStr HKCU "Software\Fennecly" "Version" "1.0.0"

  ; ---- Create a custom Start Menu folder ----
  CreateDirectory "$SMPROGRAMS\Fennecly"
  CreateShortcut "$SMPROGRAMS\Fennecly\Fennecly.lnk" "$INSTDIR\Fennecly.exe"
  CreateShortcut "$SMPROGRAMS\Fennecly\Uninstall Fennecly.lnk" "$INSTDIR\Uninstall Fennecly.exe"

  ; ---- Show a custom finish message ----
  ; (handled by runAfterFinish: true in package.json)
!macroend

!macro customUnInstall
  ; Clean up registry entries on uninstall
  DeleteRegKey HKCU "Software\Fennecly"

  ; Remove Start Menu folder
  Delete "$SMPROGRAMS\Fennecly\Fennecly.lnk"
  Delete "$SMPROGRAMS\Fennecly\Uninstall Fennecly.lnk"
  RMDir "$SMPROGRAMS\Fennecly"
!macroend
