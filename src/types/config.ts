export type HotkeyPreset = 'ctrl+g' | 'alt+g' | 'ctrl+shift+g' | 'double_ctrl' | 'mbutton';

export type FollowMode = 'popup_at_cursor' | 'smooth_follow_hud' | 'dialog_bottom_dock';

export type TriggerBehavior = 'smart_switch' | 'always_menu' | 'always_direct';

export type HudTheme = 'dark' | 'light';

export type NavSection = 'simulator' | 'settings' | 'favorites' | 'export';

export interface FavoriteFolder {
  id: string;
  name: string;
  path: string;
  shortcutKey: string; // '1' - '9' or ''
  group: string;
}

export interface TargetAppsConfig {
  win32FileDialogs: boolean; // #32770 Open/Save dialogs
  fileExplorer: boolean; // CabinetWClass
  modernDialogs: boolean; // WinUI / UWP / Electron dialogs
  terminalSwitch: boolean; // Windows Terminal / PowerShell / CMD (cd /d)
}

export interface QuickJumpConfig {
  hotkey: HotkeyPreset;
  enableMiddleClick: boolean;
  triggerBehavior: TriggerBehavior;
  followMode: FollowMode;
  offsetX: number;
  offsetY: number;
  followSmoothness: number; // 0.12 (very smooth) - 0.85 (snappy)
  edgePadding: number;
  preserveFilename: boolean;
  autoHideOnBlur: boolean;
  hudTheme: HudTheme;
  targetApps: TargetAppsConfig;
}

export interface SimulatedFolderNode {
  path: string;
  name: string;
  files: { name: string; size: string; modified: string; kind: 'folder' | 'file' }[];
}

export interface ExplorerWindowState {
  id: string;
  title: string;
  path: string;
  lastFocusedAt: number;
  x: number;
  y: number;
}

export interface JumpLogEntry {
  id: string;
  timestamp: string;
  trigger: string;
  sourceLabel: string;
  targetPath: string;
  preservedFilename: string | null;
  mode: string;
}

export const DEFAULT_CONFIG: QuickJumpConfig = {
  hotkey: 'ctrl+g',
  enableMiddleClick: true,
  triggerBehavior: 'smart_switch',
  followMode: 'smooth_follow_hud',
  offsetX: 18,
  offsetY: 22,
  followSmoothness: 0.28,
  edgePadding: 14,
  preserveFilename: true,
  autoHideOnBlur: true,
  hudTheme: 'dark',
  targetApps: {
    win32FileDialogs: true,
    fileExplorer: true,
    modernDialogs: true,
    terminalSwitch: false,
  },
};

export const DEFAULT_FAVORITES: FavoriteFolder[] = [
  {
    id: 'fav-1',
    name: '设计素材归档',
    path: 'D:\\Projects\\DesignAssets\\2026_Brand',
    shortcutKey: '1',
    group: '工作项目',
  },
  {
    id: 'fav-2',
    name: '季度汇报文档',
    path: 'E:\\Work\\2026_Q4_Reports',
    shortcutKey: '2',
    group: '工作项目',
  },
  {
    id: 'fav-3',
    name: '下载目录',
    path: 'C:\\Users\\Admin\\Downloads',
    shortcutKey: '3',
    group: '常用系统',
  },
  {
    id: 'fav-4',
    name: '渲染与视频导出',
    path: 'D:\\Media\\Exports\\FinalCut',
    shortcutKey: '4',
    group: '媒体输出',
  },
  {
    id: 'fav-5',
    name: '桌面',
    path: 'C:\\Users\\Admin\\Desktop',
    shortcutKey: '5',
    group: '常用系统',
  },
];

export const HOTKEY_LABELS: Record<HotkeyPreset, { label: string; keys: string[]; ahk: string; py: string }> = {
  'ctrl+g': {
    label: 'Ctrl + G（Listary 经典）',
    keys: ['Ctrl', 'G'],
    ahk: '^g',
    py: 'ctrl+g',
  },
  'alt+g': {
    label: 'Alt + G（避免浏览器冲突）',
    keys: ['Alt', 'G'],
    ahk: '!g',
    py: 'alt+g',
  },
  'ctrl+shift+g': {
    label: 'Ctrl + Shift + G',
    keys: ['Ctrl', 'Shift', 'G'],
    ahk: '^+g',
    py: 'ctrl+shift+g',
  },
  double_ctrl: {
    label: '双击左 Ctrl',
    keys: ['Ctrl', 'Ctrl'],
    ahk: '~LControl',
    py: 'ctrl',
  },
  mbutton: {
    label: '鼠标中键（对话框内）',
    keys: ['Middle Click'],
    ahk: 'MButton',
    py: 'middle',
  },
};
