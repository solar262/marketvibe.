Set WshShell = CreateObject("WScript.Shell")
' Launch the Revenue Engine in Hidden Mode (0)
' Change the path if moved
WshShell.Run "node c:\Users\qwerty\Desktop\prototype\revenue_engine.mjs", 0, False
