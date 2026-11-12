; Keep the startup registration during an update; remove it on a full uninstall.
!macro customUnInstall
  ${ifNot} ${isUpdated}
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "O-Isym"
  ${endIf}
!macroend
