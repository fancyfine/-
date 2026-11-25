import { FavoriteFolder, HOTKEY_LABELS, QuickJumpConfig } from '../types/config';

function escapeAhkString(str: string): string {
  return str.replace(/`/g, '``').replace(/"/g, '`"');
}

function escapePyString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function generateConfigJson(config: QuickJumpConfig, favorites: FavoriteFolder[]): string {
  return JSON.stringify(
    {
      app: 'QuickJump',
      hotkey: config.hotkey,
      enableMiddleClick: config.enableMiddleClick,
      triggerBehavior: config.triggerBehavior,
      followMode: config.followMode,
      mouseOffset: { x: config.offsetX, y: config.offsetY },
      followSmoothness: config.followSmoothness,
      edgePadding: config.edgePadding,
      preserveFilename: config.preserveFilename,
      autoHideOnBlur: config.autoHideOnBlur,
      hudTheme: config.hudTheme,
      targetApps: config.targetApps,
      favorites: favorites.map((f) => ({
        name: f.name,
        path: f.path,
        shortcutKey: f.shortcutKey,
        group: f.group,
      })),
    },
    null,
    2
  );
}

export function generateAhkV2Script(config: QuickJumpConfig, favorites: FavoriteFolder[]): string {
  const hotkeyMeta = HOTKEY_LABELS[config.hotkey];
  const isDark = config.hudTheme === 'dark';
  const bgHex = isDark ? '141821' : 'FFFFFF';
  const surfaceHex = isDark ? '1E2534' : 'F1F5F9';
  const fgHex = isDark ? 'F1F5F9' : '0F172A';
  const mutedHex = isDark ? '94A3B8' : '64748B';
  const accentHex = '2563EB';

  const favEntries = favorites
    .map(
      (f) =>
        `    Map("name", "${escapeAhkString(f.name)}", "path", "${escapeAhkString(f.path)}", "key", "${escapeAhkString(f.shortcutKey)}", "group", "${escapeAhkString(f.group)}")`
    )
    .join(',\n');

  const hotkeyRegistration =
    config.hotkey === 'double_ctrl'
      ? `~LControl:: {
    static lastTap := 0
    if (A_TickCount - lastTap < 320) {
        lastTap := 0
        TriggerQuickJump()
    } else {
        lastTap := A_TickCount
    }
}`
      : `${hotkeyMeta.ahk}::TriggerQuickJump()`;

  const middleClickBlock =
    config.enableMiddleClick && config.hotkey !== 'mbutton'
      ? `
#HotIf IsFileDialogActive()
MButton::ShowCursorMenu(WinExist("A"))
#HotIf`
      : '';

  return `; ============================================================================
; QuickJump — 仿 Listary Ctrl+G 快速切换与鼠标跟随程序 (AutoHotkey v2)
; 运行方式: 安装 AutoHotkey v2 后双击运行；也可用 Ahk2Exe 编译为独立 .exe
; ============================================================================
#Requires AutoHotkey v2.0
#SingleInstance Force
SendMode "Input"
CoordMode "Mouse", "Screen"

; --- 用户配置参数 ---
global CFG_TRIGGER_BEHAVIOR := "${config.triggerBehavior}" ; smart_switch | always_menu | always_direct
global CFG_FOLLOW_MODE      := "${config.followMode}"      ; popup_at_cursor | smooth_follow_hud | dialog_bottom_dock
global CFG_OFFSET_X         := ${config.offsetX}
global CFG_OFFSET_Y         := ${config.offsetY}
global CFG_SMOOTHNESS       := ${config.followSmoothness.toFixed(2)}
global CFG_EDGE_PADDING     := ${config.edgePadding}
global CFG_PRESERVE_NAME    := ${config.preserveFilename ? 'true' : 'false'}
global CFG_AUTO_HIDE_BLUR   := ${config.autoHideOnBlur ? 'true' : 'false'}
global CFG_TERMINAL_SWITCH  := ${config.targetApps.terminalSwitch ? 'true' : 'false'}

global Favorites := [
${favEntries || '    ; 暂无预设收藏目录'}
]

global PopupGui := ""
global FollowHudGui := ""
global FollowHudText := ""
global HudCurX := 0
global HudCurY := 0
global ActiveTargetHwnd := 0
global CurrentItems := []
global SearchEdit := ""
global ResultList := ""

; 创建系统托盘菜单
A_TrayMenu.Delete()
A_TrayMenu.Add("立即打开鼠标跟随切换菜单", (*) => ShowCursorMenu(WinExist("A")))
A_TrayMenu.Add("切换实时鼠标跟随悬浮条", ToggleFollowHud)
A_TrayMenu.Add()
A_TrayMenu.Add("退出 QuickJump", (*) => ExitApp())
A_IconTip := "QuickJump (${hotkeyMeta.keys.join('+')}) — 鼠标跟随快速切换"

; 若启用实时鼠标跟随 HUD，启动 60fps 定时监测
if (CFG_FOLLOW_MODE = "smooth_follow_hud" || CFG_FOLLOW_MODE = "dialog_bottom_dock") {
    InitFollowHud()
    SetTimer(UpdateFollowHud, 16)
}

; --- 热键绑定 ---
${hotkeyRegistration}
${middleClickBlock}

; ============================================================================
; 1. 核心触发入口
; ============================================================================
TriggerQuickJump() {
    global CFG_TRIGGER_BEHAVIOR
    hwnd := WinExist("A")
    explorerPaths := GetOpenExplorerPaths()

    ; 文件对话框场景下的智能直达模式
    if (IsFileDialogHwnd(hwnd) && explorerPaths.Length > 0) {
        if (CFG_TRIGGER_BEHAVIOR = "always_direct") {
            JumpToFolder(hwnd, explorerPaths[1].path)
            return
        }
        if (CFG_TRIGGER_BEHAVIOR = "smart_switch" && explorerPaths.Length = 1) {
            JumpToFolder(hwnd, explorerPaths[1].path)
            return
        }
    }

    ; 其余场景：在当前鼠标指针旁弹出跟随切换菜单
    ShowCursorMenu(hwnd)
}

; ============================================================================
; 2. 读取所有已打开的 Windows 资源管理器路径 (含 Win11 多标签页)
; ============================================================================
GetOpenExplorerPaths() {
    paths := []
    seen := Map()
    try {
        shell := ComObject("Shell.Application")
        for win in shell.Windows {
            try {
                fullName := win.FullName
                if !InStr(fullName, "explorer.exe")
                    continue
                folderPath := win.Document.Folder.Self.Path
                if (folderPath != "" && DirExist(folderPath) && !seen.Has(folderPath)) {
                    seen[folderPath] := true
                    SplitPath(folderPath, &folderName)
                    if (folderName = "")
                        folderName := folderPath
                    paths.Push(Map("name", folderName, "path", folderPath, "source", "当前打开"))
                }
            }
        }
    }
    return paths
}

; ============================================================================
; 3. 检测标准文件打开/保存对话框 (#32770) 及终端
; ============================================================================
IsFileDialogActive() {
    return IsFileDialogHwnd(WinExist("A"))
}

IsFileDialogHwnd(hwnd) {
    if !hwnd
        return false
    cls := WinGetClass("ahk_id " hwnd)
    if (cls = "#32770") {
        ; 确认包含路径/文件名输入框 Edit1
        try {
            if ControlGetHwnd("Edit1", "ahk_id " hwnd)
                return true
        }
    }
    return false
}

IsTerminalHwnd(hwnd) {
    if !hwnd
        return false
    cls := WinGetClass("ahk_id " hwnd)
    return (cls = "CASCADIA_HOSTING_WINDOW_CLASS" || cls = "ConsoleWindowClass")
}

; ============================================================================
; 4. 执行跳转（保留原文件名，与 Listary Ctrl+G 一致）
; ============================================================================
JumpToFolder(hwnd, targetPath) {
    global CFG_PRESERVE_NAME, CFG_TERMINAL_SWITCH
    if !DirExist(targetPath) {
        ShowCursorToast("目录不存在: " targetPath)
        return
    }

    if (hwnd && WinExist("ahk_id " hwnd)) {
        WinActivate("ahk_id " hwnd)
        WinWaitActive("ahk_id " hwnd, , 0.5)
    }

    ; 场景 A: 标准文件打开 / 保存对话框 (#32770)
    if (IsFileDialogHwnd(hwnd)) {
        oldName := ""
        try oldName := ControlGetText("Edit1", "ahk_id " hwnd)

        ; 写入目标文件夹路径并提交跳转
        ControlSetText(targetPath, "Edit1", "ahk_id " hwnd)
        ControlFocus("Edit1", "ahk_id " hwnd)
        Sleep(40)
        ControlSend("{Enter}", "Edit1", "ahk_id " hwnd)

        ; 还原用户之前输入的文件名（排除完整路径）
        if (CFG_PRESERVE_NAME && oldName != "" && !InStr(oldName, "\\")) {
            Sleep(130)
            try ControlSetText(oldName, "Edit1", "ahk_id " hwnd)
        }
        ShowCursorToast("已切换至 " targetPath)
        return
    }

    ; 场景 B: Windows 终端 / PowerShell / CMD
    if (CFG_TERMINAL_SWITCH && IsTerminalHwnd(hwnd)) {
        SendText('cd /d "' targetPath '"')
        Send("{Enter}")
        ShowCursorToast("终端已切换至 " targetPath)
        return
    }

    ; 场景 C: 当前为资源管理器窗口 — 通过地址栏 Alt+D 切换
    if (hwnd && WinGetClass("ahk_id " hwnd) = "CabinetWClass") {
        Send("!d")
        Sleep(60)
        SendText(targetPath)
        Send("{Enter}")
        ShowCursorToast("资源管理器已跳转")
        return
    }

    ; 场景 D: 其他窗口 — 直接打开资源管理器
    Run('explorer.exe "' targetPath '"')
}

; ============================================================================
; 5. 鼠标位置锚定弹窗 (Ctrl+G 快捷切换面板)
; ============================================================================
ShowCursorMenu(targetHwnd) {
    global PopupGui, ActiveTargetHwnd, SearchEdit, ResultList, CurrentItems
    global CFG_OFFSET_X, CFG_OFFSET_Y, CFG_EDGE_PADDING, CFG_AUTO_HIDE_BLUR

    if IsObject(PopupGui) {
        PopupGui.Destroy()
        PopupGui := ""
    }

    ActiveTargetHwnd := targetHwnd
    PopupGui := Gui("+AlwaysOnTop -Caption +ToolWindow +Border", "QuickJump")
    PopupGui.BackColor := "${bgHex}"
    PopupGui.MarginX := 12
    PopupGui.MarginY := 10
    PopupGui.SetFont("s10 c${fgHex}", "Microsoft YaHei UI")

    PopupGui.AddText("w396 c${mutedHex} s9", "QuickJump 鼠标跟随切换 · 回车跳转 · 1-9 直达 · Esc 关闭")
    SearchEdit := PopupGui.AddEdit("w396 h28 Background${surfaceHex} c${fgHex} -E0x200")
    SearchEdit.OnEvent("Change", (*) => RefreshMenuItems())

    ResultList := PopupGui.AddListBox("w396 r9 Background${bgHex} c${fgHex} -E0x200 +VScroll")
    ResultList.OnEvent("DoubleClick", (*) => ConfirmSelection())

    PopupGui.OnEvent("Escape", (*) => CloseCursorMenu())
    if (CFG_AUTO_HIDE_BLUR) {
        OnMessage(0x0006, OnPopupActivate)
    }

    RefreshMenuItems()

    ; 获取当前鼠标坐标，自动防屏幕边缘溢出
    MouseGetPos(&mx, &my)
    winW := 424
    winH := 290
    pos := ClampToMonitorWorkArea(mx + CFG_OFFSET_X, my + CFG_OFFSET_Y, winW, winH, CFG_EDGE_PADDING)

    PopupGui.Show("x" pos.x " y" pos.y " w" winW)
    SearchEdit.Focus()
}

RefreshMenuItems() {
    global SearchEdit, ResultList, CurrentItems, Favorites
    query := StrLower(Trim(SearchEdit.Value))
    CurrentItems := []
    displayRows := []

    ; 优先列出当前已打开的资源管理器文件夹
    for item in GetOpenExplorerPaths() {
        if (query = "" || InStr(StrLower(item["name"] " " item["path"]), query)) {
            CurrentItems.Push(item)
            displayRows.Push("[打开中] " item["name"] "  —  " item["path"])
        }
    }

    ; 再列出用户收藏目录
    for fav in Favorites {
        if (query = "" || InStr(StrLower(fav["name"] " " fav["path"] " " fav["group"]), query)) {
            CurrentItems.Push(fav)
            prefix := fav["key"] != "" ? "[" fav["key"] "] " : "[收藏] "
            displayRows.Push(prefix fav["name"] "  —  " fav["path"])
        }
    }

    ResultList.Delete()
    if (displayRows.Length > 0) {
        ResultList.Add(displayRows)
        ResultList.Choose(1)
    }
}

ConfirmSelection() {
    global ResultList, CurrentItems, ActiveTargetHwnd
    idx := ResultList.Value
    if (idx < 1 || idx > CurrentItems.Length)
        return
    chosenPath := CurrentItems[idx]["path"]
    targetHwnd := ActiveTargetHwnd
    CloseCursorMenu()
    JumpToFolder(targetHwnd, chosenPath)
}

CloseCursorMenu() {
    global PopupGui
    if IsObject(PopupGui) {
        PopupGui.Destroy()
        PopupGui := ""
    }
}

OnPopupActivate(wParam, lParam, msg, hwnd) {
    global PopupGui
    if (IsObject(PopupGui) && hwnd = PopupGui.Hwnd && (wParam & 0xFFFF) = 0) {
        SetTimer(CloseCursorMenu, -30)
    }
}

#HotIf IsObject(PopupGui) && WinActive("ahk_id " PopupGui.Hwnd)
Enter::ConfirmSelection()
Down::MoveListSelection(1)
Up::MoveListSelection(-1)
1::JumpByShortcutKey("1")
2::JumpByShortcutKey("2")
3::JumpByShortcutKey("3")
4::JumpByShortcutKey("4")
5::JumpByShortcutKey("5")
6::JumpByShortcutKey("6")
7::JumpByShortcutKey("7")
8::JumpByShortcutKey("8")
9::JumpByShortcutKey("9")
#HotIf

MoveListSelection(delta) {
    global ResultList, CurrentItems
    if (CurrentItems.Length = 0)
        return
    nextIdx := ResultList.Value + delta
    if (nextIdx < 1)
        nextIdx := CurrentItems.Length
    if (nextIdx > CurrentItems.Length)
        nextIdx := 1
    ResultList.Choose(nextIdx)
}

JumpByShortcutKey(digit) {
    global Favorites, ActiveTargetHwnd
    for fav in Favorites {
        if (fav["key"] = digit) {
            targetHwnd := ActiveTargetHwnd
            CloseCursorMenu()
            JumpToFolder(targetHwnd, fav["path"])
            return
        }
    }
}

; ============================================================================
; 6. 实时鼠标平滑跟随悬浮条 / 对话框底部吸附条
; ============================================================================
InitFollowHud() {
    global FollowHudGui, FollowHudText
    FollowHudGui := Gui("+AlwaysOnTop -Caption +ToolWindow +E0x08000000 +Border")
    FollowHudGui.BackColor := "${bgHex}"
    FollowHudGui.MarginX := 10
    FollowHudGui.MarginY := 6
    FollowHudGui.SetFont("s9 c${fgHex}", "Microsoft YaHei UI")
    FollowHudText := FollowHudGui.AddText("w290 +0x8000", "${hotkeyMeta.keys.join('+')} 切换至资源管理器目录")
    FollowHudText.OnEvent("Click", (*) => TriggerQuickJump())
}

ToggleFollowHud(*) {
    global FollowHudGui
    if !IsObject(FollowHudGui) {
        InitFollowHud()
        SetTimer(UpdateFollowHud, 16)
    } else {
        SetTimer(UpdateFollowHud, 0)
        FollowHudGui.Destroy()
        FollowHudGui := ""
    }
}

UpdateFollowHud() {
    global FollowHudGui, FollowHudText, HudCurX, HudCurY
    global CFG_FOLLOW_MODE, CFG_OFFSET_X, CFG_OFFSET_Y, CFG_SMOOTHNESS, CFG_EDGE_PADDING
    if !IsObject(FollowHudGui)
        return

    hwnd := WinExist("A")
    if !IsFileDialogHwnd(hwnd) {
        FollowHudGui.Hide()
        return
    }

    paths := GetOpenExplorerPaths()
    label := paths.Length > 0 ? "${hotkeyMeta.keys.join('+')} → " paths[1]["name"] : "${hotkeyMeta.keys.join('+')} 打开收藏目录"
    if (FollowHudText.Value != label)
        FollowHudText.Value := label

    if (CFG_FOLLOW_MODE = "dialog_bottom_dock") {
        WinGetPos(&wx, &wy, &ww, &wh, "ahk_id " hwnd)
        FollowHudGui.Show("NoActivate x" wx " y" (wy + wh + 6) " w" Min(ww, 340))
    } else {
        MouseGetPos(&mx, &my)
        pos := ClampToMonitorWorkArea(mx + CFG_OFFSET_X, my + CFG_OFFSET_Y, 312, 34, CFG_EDGE_PADDING)
        if (HudCurX = 0 && HudCurY = 0) {
            HudCurX := pos.x
            HudCurY := pos.y
        } else {
            HudCurX := Round(HudCurX + (pos.x - HudCurX) * CFG_SMOOTHNESS)
            HudCurY := Round(HudCurY + (pos.y - HudCurY) * CFG_SMOOTHNESS)
        }
        FollowHudGui.Show("NoActivate x" HudCurX " y" HudCurY)
    }
}

; ============================================================================
; 7. 多显示器屏幕边缘防溢出算法 & 指针旁轻量提示
; ============================================================================
ClampToMonitorWorkArea(x, y, w, h, pad) {
    monCount := MonitorGetCount()
    loop monCount {
        MonitorGetWorkArea(A_Index, &left, &top, &right, &bottom)
        if (x >= left && x <= right && y >= top && y <= bottom) {
            cx := Min(Max(x, left + pad), right - w - pad)
            cy := Min(Max(y, top + pad), bottom - h - pad)
            return { x: cx, y: cy }
        }
    }
    MonitorGetWorkArea(, &left, &top, &right, &bottom)
    return {
        x: Min(Max(x, left + pad), right - w - pad),
        y: Min(Max(y, top + pad), bottom - h - pad)
    }
}

ShowCursorToast(msg) {
    ToolTip(msg)
    SetTimer(() => ToolTip(), -1400)
}
`;
}

export function generatePythonScript(config: QuickJumpConfig, favorites: FavoriteFolder[]): string {
  const hotkeyMeta = HOTKEY_LABELS[config.hotkey];
  const isDark = config.hudTheme === 'dark';

  const favListPy = favorites
    .map(
      (f) =>
        `    {"name": "${escapePyString(f.name)}", "path": r"${f.path}", "key": "${escapePyString(f.shortcutKey)}", "group": "${escapePyString(f.group)}"},`
    )
    .join('\n');

  return `# -*- coding: utf-8 -*-
"""
QuickJump — 仿 Listary Ctrl+G 快速切换与鼠标跟随桌面程序 (Python + Win32)
依赖安装: pip install pywin32 keyboard
打包 EXE: pyinstaller --noconsole --onefile --name QuickJump quickjump_app.py
"""

import json
import os
import threading
import time
import tkinter as tk
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import keyboard
import pythoncom
import win32api
import win32com.client
import win32con
import win32gui

# --- 默认配置（可被同目录 quickjump_config.json 覆盖） ---
CONFIG = {
    "hotkey": "${hotkeyMeta.py}",
    "triggerBehavior": "${config.triggerBehavior}",
    "followMode": "${config.followMode}",
    "offsetX": ${config.offsetX},
    "offsetY": ${config.offsetY},
    "followSmoothness": ${config.followSmoothness.toFixed(2)},
    "edgePadding": ${config.edgePadding},
    "preserveFilename": ${config.preserveFilename ? 'True' : 'False'},
    "autoHideOnBlur": ${config.autoHideOnBlur ? 'True' : 'False'},
    "hudTheme": "${config.hudTheme}",
}

FAVORITES: List[Dict[str, str]] = [
${favListPy}
]

THEME = {
    "bg": "${isDark ? '#141821' : '#FFFFFF'}",
    "surface": "${isDark ? '#1E2534' : '#F1F5F9'}",
    "fg": "${isDark ? '#F1F5F9' : '#0F172A'}",
    "muted": "${isDark ? '#94A3B8' : '#64748B'}",
    "accent": "#2563EB",
    "border": "${isDark ? '#334155' : '#CBD5E1'}",
}


def load_external_config() -> None:
    cfg_path = Path(__file__).parent / "quickjump_config.json"
    if not cfg_path.exists():
        return
    try:
        data = json.loads(cfg_path.read_text(encoding="utf-8"))
        if "mouseOffset" in data:
            CONFIG["offsetX"] = int(data["mouseOffset"].get("x", CONFIG["offsetX"]))
            CONFIG["offsetY"] = int(data["mouseOffset"].get("y", CONFIG["offsetY"]))
        for k in ("triggerBehavior", "followMode", "followSmoothness", "edgePadding", "preserveFilename"):
            if k in data:
                CONFIG[k] = data[k]
        if isinstance(data.get("favorites"), list) and data["favorites"]:
            FAVORITES.clear()
            for item in data["favorites"]:
                FAVORITES.append(
                    {
                        "name": str(item.get("name", "")),
                        "path": str(item.get("path", "")),
                        "key": str(item.get("shortcutKey", "")),
                        "group": str(item.get("group", "收藏")),
                    }
                )
    except Exception:
        pass


def get_open_explorer_paths() -> List[Dict[str, str]]:
    """通过 Windows Shell COM 接口枚举所有打开的资源管理器窗口路径"""
    pythoncom.CoInitialize()
    results: List[Dict[str, str]] = []
    seen = set()
    try:
        shell = win32com.client.Dispatch("Shell.Application")
        for window in shell.Windows():
            try:
                if "explorer.exe" not in str(window.FullName).lower():
                    continue
                folder_path = window.Document.Folder.Self.Path
                if folder_path and os.path.isdir(folder_path) and folder_path not in seen:
                    seen.add(folder_path)
                    results.append(
                        {
                            "name": os.path.basename(folder_path.rstrip("\\\\")) or folder_path,
                            "path": folder_path,
                            "key": "",
                            "group": "当前打开",
                        }
                    )
            except Exception:
                continue
    finally:
        pythoncom.CoUninitialize()
    return results


def is_file_dialog(hwnd: int) -> bool:
    if not hwnd or not win32gui.IsWindow(hwnd):
        return False
    return win32gui.GetClassName(hwnd) == "#32770"


def find_dialog_edit_hwnd(dialog_hwnd: int) -> Optional[int]:
    """定位 #32770 对话框的文件名/路径输入框 Edit"""
    combo_ex = win32gui.FindWindowEx(dialog_hwnd, 0, "ComboBoxEx32", None)
    if combo_ex:
        combo = win32gui.FindWindowEx(combo_ex, 0, "ComboBox", None)
        if combo:
            edit = win32gui.FindWindowEx(combo, 0, "Edit", None)
            if edit:
                return edit
    edit = win32gui.FindWindowEx(dialog_hwnd, 0, "Edit", None)
    return edit if edit else None


def jump_to_folder(target_hwnd: int, target_path: str) -> None:
    if not os.path.isdir(target_path):
        return

    if is_file_dialog(target_hwnd):
        edit_hwnd = find_dialog_edit_hwnd(target_hwnd)
        if edit_hwnd:
            old_text = win32gui.GetWindowText(edit_hwnd)
            win32gui.SetForegroundWindow(target_hwnd)
            win32gui.SendMessage(edit_hwnd, win32con.WM_SETTEXT, 0, target_path)
            win32gui.PostMessage(edit_hwnd, win32con.WM_KEYDOWN, win32con.VK_RETURN, 0)
            win32gui.PostMessage(edit_hwnd, win32con.WM_KEYUP, win32con.VK_RETURN, 0)

            # 保留原有文件名
            if CONFIG["preserveFilename"] and old_text and "\\\\" not in old_text:
                time.sleep(0.14)
                win32gui.SendMessage(edit_hwnd, win32con.WM_SETTEXT, 0, old_text)
            return

    # 兜底：使用资源管理器直接打开目标目录
    os.startfile(target_path)


def clamp_to_screen(x: int, y: int, w: int, h: int, pad: int) -> Tuple[int, int]:
    sw = win32api.GetSystemMetrics(win32con.SM_CXSCREEN)
    sh = win32api.GetSystemMetrics(win32con.SM_CYSCREEN)
    cx = max(pad, min(x, sw - w - pad))
    cy = max(pad, min(y, sh - h - pad))
    return cx, cy


class QuickJumpApp:
    def __init__(self) -> None:
        self.root = tk.Tk()
        self.root.withdraw()
        self.popup: Optional[tk.Toplevel] = None
        self.hud: Optional[tk.Toplevel] = None
        self.hud_label: Optional[tk.Label] = None
        self.hud_pos = [0.0, 0.0]
        self.active_hwnd = 0
        self.filtered_items: List[Dict[str, str]] = []
        self.last_explorer_cache: List[Dict[str, str]] = []
        self.last_cache_ts = 0.0

        if CONFIG["followMode"] in ("smooth_follow_hud", "dialog_bottom_dock"):
            self._init_follow_hud()
            self.root.after(16, self._tick_follow_hud)

        self._bind_global_hotkey()

    def _bind_global_hotkey(self) -> None:
        hk = CONFIG["hotkey"]
        if hk not in ("middle", "ctrl"):
            keyboard.add_hotkey(hk, lambda: self.root.after(0, self.on_hotkey_triggered), suppress=True)

    def _init_follow_hud(self) -> None:
        self.hud = tk.Toplevel(self.root)
        self.hud.overrideredirect(True)
        self.hud.attributes("-topmost", True)
        self.hud.configure(bg=THEME["border"], padx=1, pady=1)
        inner = tk.Frame(self.hud, bg=THEME["bg"], padx=10, pady=6)
        inner.pack(fill="both", expand=True)
        self.hud_label = tk.Label(
            inner,
            text="${hotkeyMeta.keys.join('+')} 切换资源管理器路径",
            bg=THEME["bg"],
            fg=THEME["fg"],
            font=("Microsoft YaHei UI", 9),
            cursor="hand2",
        )
        self.hud_label.pack()
        self.hud_label.bind("<Button-1>", lambda _e: self.on_hotkey_triggered())
        self.hud.withdraw()

    def _tick_follow_hud(self) -> None:
        if self.hud and self.hud_label:
            hwnd = win32gui.GetForegroundWindow()
            if is_file_dialog(hwnd):
                now = time.time()
                if now - self.last_cache_ts > 0.8:
                    self.last_explorer_cache = get_open_explorer_paths()
                    self.last_cache_ts = now

                if self.last_explorer_cache:
                    txt = f"${hotkeyMeta.keys.join('+')} → {self.last_explorer_cache[0]['name']}"
                else:
                    txt = "${hotkeyMeta.keys.join('+')} 打开收藏目录"
                self.hud_label.configure(text=txt)

                if CONFIG["followMode"] == "dialog_bottom_dock":
                    l, _t, r, b = win32gui.GetWindowRect(hwnd)
                    self.hud.geometry(f"+{l}+{b + 6}")
                else:
                    mx, my = win32api.GetCursorPos()
                    tx, ty = clamp_to_screen(
                        mx + CONFIG["offsetX"],
                        my + CONFIG["offsetY"],
                        280,
                        36,
                        CONFIG["edgePadding"],
                    )
                    if self.hud_pos[0] == 0 and self.hud_pos[1] == 0:
                        self.hud_pos = [float(tx), float(ty)]
                    else:
                        s = float(CONFIG["followSmoothness"])
                        self.hud_pos[0] += (tx - self.hud_pos[0]) * s
                        self.hud_pos[1] += (ty - self.hud_pos[1]) * s
                    self.hud.geometry(f"+{int(self.hud_pos[0])}+{int(self.hud_pos[1])}")
                self.hud.deiconify()
            else:
                self.hud.withdraw()
        self.root.after(16, self._tick_follow_hud)

    def on_hotkey_triggered(self) -> None:
        hwnd = win32gui.GetForegroundWindow()
        explorer_paths = get_open_explorer_paths()

        if is_file_dialog(hwnd) and explorer_paths:
            behavior = CONFIG["triggerBehavior"]
            if behavior == "always_direct" or (behavior == "smart_switch" and len(explorer_paths) == 1):
                threading.Thread(
                    target=jump_to_folder,
                    args=(hwnd, explorer_paths[0]["path"]),
                    daemon=True,
                ).start()
                return

        self.show_cursor_menu(hwnd, explorer_paths)

    def show_cursor_menu(self, target_hwnd: int, explorer_paths: List[Dict[str, str]]) -> None:
        self.close_popup()
        self.active_hwnd = target_hwnd
        all_items = explorer_paths + FAVORITES

        win = tk.Toplevel(self.root)
        win.overrideredirect(True)
        win.attributes("-topmost", True)
        win.configure(bg=THEME["border"], padx=1, pady=1)

        container = tk.Frame(win, bg=THEME["bg"], padx=12, pady=10)
        container.pack(fill="both", expand=True)

        header = tk.Label(
            container,
            text="QuickJump 鼠标跟随切换 · 回车跳转 · 1-9 直达 · Esc 关闭",
            bg=THEME["bg"],
            fg=THEME["muted"],
            font=("Microsoft YaHei UI", 8),
            anchor="w",
        )
        header.pack(fill="x", pady=(0, 6))

        query_var = tk.StringVar()
        entry = tk.Entry(
            container,
            textvariable=query_var,
            bg=THEME["surface"],
            fg=THEME["fg"],
            insertbackground=THEME["fg"],
            relief="flat",
            font=("Microsoft YaHei UI", 10),
        )
        entry.pack(fill="x", ipady=5, pady=(0, 8))

        listbox = tk.Listbox(
            container,
            bg=THEME["bg"],
            fg=THEME["fg"],
            selectbackground=THEME["accent"],
            selectforeground="#FFFFFF",
            relief="flat",
            highlightthickness=0,
            font=("Microsoft YaHei UI", 9),
            height=9,
            width=54,
        )
        listbox.pack(fill="both", expand=True)

        def refresh(*_args: object) -> None:
            q = query_var.get().strip().lower()
            listbox.delete(0, tk.END)
            self.filtered_items = []
            for item in all_items:
                hay = f"{item['name']} {item['path']} {item['group']}".lower()
                if not q or q in hay:
                    self.filtered_items.append(item)
                    prefix = f"[{item['key']}] " if item["key"] else f"[{item['group']}] "
                    listbox.insert(tk.END, f"{prefix}{item['name']}  —  {item['path']}")
            if self.filtered_items:
                listbox.selection_set(0)

        def confirm(_e: object = None) -> None:
            sel = listbox.curselection()
            if not sel:
                return
            chosen = self.filtered_items[sel[0]]["path"]
            hwnd = self.active_hwnd
            self.close_popup()
            threading.Thread(target=jump_to_folder, args=(hwnd, chosen), daemon=True).start()

        def on_key_digit(event: tk.Event) -> None:
            if event.char.isdigit() and event.char != "0":
                for fav in FAVORITES:
                    if fav["key"] == event.char:
                        hwnd = self.active_hwnd
                        self.close_popup()
                        threading.Thread(target=jump_to_folder, args=(hwnd, fav["path"]), daemon=True).start()
                        return

        query_var.trace_add("write", refresh)
        refresh()

        win.bind("<Escape>", lambda _e: self.close_popup())
        entry.bind("<Return>", confirm)
        listbox.bind("<Return>", confirm)
        listbox.bind("<Double-Button-1>", confirm)
        win.bind("<Key>", on_key_digit)
        if CONFIG["autoHideOnBlur"]:
            win.bind("<FocusOut>", lambda _e: self.root.after(60, self._check_blur))

        mx, my = win32api.GetCursorPos()
        px, py = clamp_to_screen(mx + CONFIG["offsetX"], my + CONFIG["offsetY"], 440, 290, CONFIG["edgePadding"])
        win.geometry(f"440x290+{px}+{py}")
        self.popup = win
        win.focus_force()
        entry.focus_set()

    def _check_blur(self) -> None:
        if self.popup and self.popup.focus_get() is None:
            self.close_popup()

    def close_popup(self) -> None:
        if self.popup:
            try:
                self.popup.destroy()
            except Exception:
                pass
            self.popup = None

    def run(self) -> None:
        self.root.mainloop()


if __name__ == "__main__":
    load_external_config()
    QuickJumpApp().run()
`;
}

export function generateBuildBat(): string {
  return `@echo off
chcp 65001 >nul
echo ======================================================
echo   QuickJump — 一键安装依赖并打包为独立 Windows .exe
echo ======================================================
echo.
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Python 3，请先从 python.org 安装 Python 3.10+。
    pause
    exit /b 1
)

echo [1/3] 正在安装运行与打包依赖 (pywin32, keyboard, pyinstaller)...
pip install --upgrade pywin32 keyboard pyinstaller

echo [2/3] 正在编译无黑框独立可执行文件 QuickJump.exe ...
pyinstaller --noconsole --onefile --clean --name QuickJump quickjump_app.py

echo [3/3] 完成！请在 dist\\QuickJump.exe 查看生成的独立软件。
echo 提示：将 quickjump_config.json 放到 QuickJump.exe 同级目录即可热更新目录配置。
pause
`;
}
