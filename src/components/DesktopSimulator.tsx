import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CornerDownLeft,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderOpen,
  MousePointer2,
  Search,
  Star,
  X,
} from 'lucide-react';
import {
  ExplorerWindowState,
  FavoriteFolder,
  FollowMode,
  HOTKEY_LABELS,
  JumpLogEntry,
  QuickJumpConfig,
  SimulatedFolderNode,
  TriggerBehavior,
} from '../types/config';

interface DesktopSimulatorProps {
  config: QuickJumpConfig;
  favorites: FavoriteFolder[];
  onUpdateConfig: (partial: Partial<QuickJumpConfig>) => void;
}

const VIRTUAL_FS: Record<string, SimulatedFolderNode> = {
  'C:\\Users\\Admin\\Documents': {
    path: 'C:\\Users\\Admin\\Documents',
    name: 'Documents',
    files: [
      { name: '会议纪要_2026.docx', size: '148 KB', modified: '2026-11-22', kind: 'file' },
      { name: '系统默认模板', size: '--', modified: '2026-10-14', kind: 'folder' },
      { name: '个人笔记.txt', size: '12 KB', modified: '2026-11-20', kind: 'file' },
    ],
  },
  'D:\\Projects\\DesignAssets\\2026_Brand': {
    path: 'D:\\Projects\\DesignAssets\\2026_Brand',
    name: '2026_Brand',
    files: [
      { name: 'brand_guidelines_v4.pdf', size: '14.2 MB', modified: '2026-11-24', kind: 'file' },
      { name: 'logo_lockup_dark.svg', size: '42 KB', modified: '2026-11-25', kind: 'file' },
      { name: 'key_visual_4k.png', size: '8.7 MB', modified: '2026-11-25', kind: 'file' },
      { name: 'Exports', size: '--', modified: '2026-11-25', kind: 'folder' },
    ],
  },
  'E:\\Work\\2026_Q4_Reports': {
    path: 'E:\\Work\\2026_Q4_Reports',
    name: '2026_Q4_Reports',
    files: [
      { name: 'Q4_营收预测模型.xlsx', size: '2.4 MB', modified: '2026-11-24', kind: 'file' },
      { name: '华东区渠道复盘.pptx', size: '19.8 MB', modified: '2026-11-23', kind: 'file' },
      { name: '原始数据导出.csv', size: '640 KB', modified: '2026-11-25', kind: 'file' },
    ],
  },
  'C:\\Users\\Admin\\Downloads': {
    path: 'C:\\Users\\Admin\\Downloads',
    name: 'Downloads',
    files: [
      { name: 'AutoHotkey_2.0.18_setup.exe', size: '4.1 MB', modified: '2026-11-25', kind: 'file' },
      { name: 'invoice_1125.pdf', size: '286 KB', modified: '2026-11-25', kind: 'file' },
      { name: 'ui_icons_pack.zip', size: '11.4 MB', modified: '2026-11-21', kind: 'file' },
    ],
  },
  'D:\\Media\\Exports\\FinalCut': {
    path: 'D:\\Media\\Exports\\FinalCut',
    name: 'FinalCut',
    files: [
      { name: 'product_launch_master.mp4', size: '482 MB', modified: '2026-11-25', kind: 'file' },
      { name: 'teaser_15s_vertical.mp4', size: '64 MB', modified: '2026-11-24', kind: 'file' },
      { name: 'subtitles_zh.srt', size: '18 KB', modified: '2026-11-24', kind: 'file' },
    ],
  },
  'C:\\Users\\Admin\\Desktop': {
    path: 'C:\\Users\\Admin\\Desktop',
    name: 'Desktop',
    files: [
      { name: 'QuickJump_CtrlG.ahk', size: '9 KB', modified: '2026-11-25', kind: 'file' },
      { name: '临时截图_01.png', size: '1.2 MB', modified: '2026-11-25', kind: 'file' },
    ],
  },
};

function getFolderDisplay(path: string): SimulatedFolderNode {
  if (VIRTUAL_FS[path]) return VIRTUAL_FS[path];
  const segments = path.replace(/\\+$/, '').split('\\');
  const name = segments[segments.length - 1] || path;
  return {
    path,
    name,
    files: [
      { name: `${name}_readme.md`, size: '6 KB', modified: '2026-11-25', kind: 'file' },
      { name: 'assets_archive.zip', size: '3.8 MB', modified: '2026-11-24', kind: 'file' },
    ],
  };
}

function getFileIcon(filename: string, kind: 'folder' | 'file') {
  if (kind === 'folder') return <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
  const lower = filename.toLowerCase();
  if (lower.endsWith('.png') || lower.endsWith('.svg') || lower.endsWith('.mp4')) {
    return <FileImage className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
  }
  if (lower.endsWith('.xlsx') || lower.endsWith('.csv')) {
    return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
  }
  if (lower.endsWith('.ahk') || lower.endsWith('.py') || lower.endsWith('.md')) {
    return <FileCode2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
  }
  return <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
}

interface MenuItem {
  id: string;
  name: string;
  path: string;
  badgeText: string;
  shortcutKey: string;
  source: 'explorer' | 'favorite';
}

export const DesktopSimulator: React.FC<DesktopSimulatorProps> = ({
  config,
  favorites,
  onUpdateConfig,
}) => {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const hudRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [explorers, setExplorers] = useState<ExplorerWindowState[]>([
    {
      id: 'exp-1',
      title: '文件资源管理器 #1',
      path: 'D:\\Projects\\DesignAssets\\2026_Brand',
      lastFocusedAt: 2,
      x: 20,
      y: 22,
    },
    {
      id: 'exp-2',
      title: '文件资源管理器 #2',
      path: 'E:\\Work\\2026_Q4_Reports',
      lastFocusedAt: 1,
      x: 42,
      y: 298,
    },
  ]);

  const [dialogPath, setDialogPath] = useState<string>('C:\\Users\\Admin\\Documents');
  const [dialogFilename, setDialogFilename] = useState<string>('homepage_hero_v3.png');
  const [dialogFlash, setDialogFlash] = useState<boolean>(false);
  const [dialogFocused, setDialogFocused] = useState<boolean>(true);

  const [popupOpen, setPopupOpen] = useState<boolean>(false);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number }>({ x: 380, y: 150 });
  const [popupQuery, setPopupQuery] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const [cursorInCanvas, setCursorInCanvas] = useState<boolean>(false);
  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number }>({ x: 420, y: 240 });
  const targetHudPos = useRef<{ x: number; y: number }>({ x: 438, y: 262 });
  const currentHudPos = useRef<{ x: number; y: number }>({ x: 438, y: 262 });

  const [cursorToast, setCursorToast] = useState<{
    message: string;
    x: number;
    y: number;
  } | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const lastCtrlTapRef = useRef<number>(0);

  const [jumpLogs, setJumpLogs] = useState<JumpLogEntry[]>([
    {
      id: 'init-1',
      timestamp: '准备就绪',
      trigger: HOTKEY_LABELS[config.hotkey].keys.join('+'),
      sourceLabel: '等待触发',
      targetPath: 'D:\\Projects\\DesignAssets\\2026_Brand',
      preservedFilename: 'homepage_hero_v3.png',
      mode: '按快捷键或在画布内点击鼠标中键体验',
    },
  ]);

  const sortedExplorers = useMemo(
    () => [...explorers].sort((a, b) => b.lastFocusedAt - a.lastFocusedAt),
    [explorers]
  );

  const primaryExplorer = sortedExplorers[0] || null;

  const menuItems = useMemo<MenuItem[]>(() => {
    const list: MenuItem[] = [];
    const seen = new Set<string>();
    for (const exp of sortedExplorers) {
      if (!seen.has(exp.path)) {
        seen.add(exp.path);
        const node = getFolderDisplay(exp.path);
        list.push({
          id: `open-${exp.id}`,
          name: node.name,
          path: exp.path,
          badgeText: '已打开窗口',
          shortcutKey: '',
          source: 'explorer',
        });
      }
    }
    for (const fav of favorites) {
      if (!seen.has(fav.path)) {
        seen.add(fav.path);
        list.push({
          id: `fav-${fav.id}`,
          name: fav.name,
          path: fav.path,
          badgeText: fav.group || '收藏',
          shortcutKey: fav.shortcutKey,
          source: 'favorite',
        });
      }
    }
    const q = popupQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.path.toLowerCase().includes(q) ||
        item.badgeText.toLowerCase().includes(q)
    );
  }, [sortedExplorers, favorites, popupQuery]);

  useEffect(() => {
    if (selectedIndex >= menuItems.length) {
      setSelectedIndex(0);
    }
  }, [menuItems.length, selectedIndex]);

  const showToastNearCursor = useCallback((message: string, x: number, y: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const maxW = rect ? rect.width : 920;
    const maxH = rect ? rect.height : 580;
    const cx = Math.max(14, Math.min(x + 14, maxW - 310));
    const cy = Math.max(14, Math.min(y - 36, maxH - 48));
    setCursorToast({ message, x: cx, y: cy });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setCursorToast(null), 2000);
  }, []);

  const executeJump = useCallback(
    (targetPath: string, sourceLabel: string, triggerLabel: string) => {
      setDialogPath(targetPath);
      setDialogFocused(true);
      setDialogFlash(true);
      setPopupOpen(false);
      setPopupQuery('');
      window.setTimeout(() => setDialogFlash(false), 650);

      const preserved = config.preserveFilename ? dialogFilename : null;
      if (!config.preserveFilename) {
        setDialogFilename('');
      }

      const now = new Date();
      const ts = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
        2,
        '0'
      )}:${String(now.getSeconds()).padStart(2, '0')}`;

      setJumpLogs((prev) => [
        {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: ts,
          trigger: triggerLabel,
          sourceLabel,
          targetPath,
          preservedFilename: preserved,
          mode: config.preserveFilename ? '已注入 Edit1 并保留文件名' : '已注入 Edit1（清空文件名）',
        },
        ...prev.filter((item) => item.id !== 'init-1').slice(0, 4),
      ]);

      const folderName = getFolderDisplay(targetPath).name;
      showToastNearCursor(
        preserved ? `已切换至 ${folderName}（保留 ${preserved}）` : `已切换至 ${folderName}`,
        cursorCoords.x,
        cursorCoords.y
      );
    },
    [config.preserveFilename, cursorCoords.x, cursorCoords.y, dialogFilename, showToastNearCursor]
  );

  const openCursorMenuAt = useCallback(
    (x: number, y: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      const canvasW = rect ? rect.width : 940;
      const canvasH = rect ? rect.height : 580;
      const menuW = 368;
      const menuH = 310;
      const pad = config.edgePadding;
      const clampedX = Math.max(pad, Math.min(x + config.offsetX, canvasW - menuW - pad));
      const clampedY = Math.max(pad, Math.min(y + config.offsetY, canvasH - menuH - pad));
      setPopupPos({ x: clampedX, y: clampedY });
      setPopupQuery('');
      setSelectedIndex(0);
      setPopupOpen(true);
      window.setTimeout(() => searchInputRef.current?.focus(), 20);
    },
    [config.edgePadding, config.offsetX, config.offsetY]
  );

  const triggerQuickJump = useCallback(
    (triggerLabel: string, forceMenu = false) => {
      if (
        !forceMenu &&
        dialogFocused &&
        primaryExplorer &&
        (config.triggerBehavior === 'always_direct' ||
          (config.triggerBehavior === 'smart_switch' && explorers.length === 1))
      ) {
        executeJump(primaryExplorer.path, primaryExplorer.title, triggerLabel);
        return;
      }
      openCursorMenuAt(cursorCoords.x, cursorCoords.y);
    },
    [
      config.triggerBehavior,
      cursorCoords.x,
      cursorCoords.y,
      dialogFocused,
      executeJump,
      explorers.length,
      openCursorMenuAt,
      primaryExplorer,
    ]
  );

  // Smooth 60fps compositor-only mouse follow loop for the floating HUD
  useEffect(() => {
    let rafId = 0;
    const animate = () => {
      const s = config.followSmoothness;
      currentHudPos.current.x += (targetHudPos.current.x - currentHudPos.current.x) * s;
      currentHudPos.current.y += (targetHudPos.current.y - currentHudPos.current.y) * s;
      if (hudRef.current) {
        hudRef.current.style.transform = `translate3d(${Math.round(
          currentHudPos.current.x
        )}px, ${Math.round(currentHudPos.current.y)}px, 0)`;
      }
      rafId = window.requestAnimationFrame(animate);
    };
    rafId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(rafId);
  }, [config.followSmoothness]);

  // Global keyboard listener for Ctrl+G / Alt+G / Ctrl+Shift+G / Double Ctrl & popup navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Popup keyboard controls
      if (popupOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setPopupOpen(false);
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (menuItems.length ? (prev + 1) % menuItems.length : 0));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) =>
            menuItems.length ? (prev - 1 + menuItems.length) % menuItems.length : 0
          );
          return;
        }
        if (e.key === 'Enter' && menuItems[selectedIndex]) {
          e.preventDefault();
          const chosen = menuItems[selectedIndex];
          executeJump(chosen.path, chosen.name, '回车选择');
          return;
        }
        if (/^[1-9]$/.test(e.key) && popupQuery === '') {
          const favMatch = favorites.find((f) => f.shortcutKey === e.key);
          if (favMatch) {
            e.preventDefault();
            executeJump(favMatch.path, favMatch.name, `数字键 ${e.key}`);
            return;
          }
        }
      }

      // Main configured hotkey trigger
      const keyLower = e.key.toLowerCase();
      if (config.hotkey === 'ctrl+g' && (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && keyLower === 'g') {
        e.preventDefault();
        triggerQuickJump('Ctrl+G');
        return;
      }
      if (config.hotkey === 'alt+g' && e.altKey && !e.ctrlKey && keyLower === 'g') {
        e.preventDefault();
        triggerQuickJump('Alt+G');
        return;
      }
      if (config.hotkey === 'ctrl+shift+g' && (e.ctrlKey || e.metaKey) && e.shiftKey && keyLower === 'g') {
        e.preventDefault();
        triggerQuickJump('Ctrl+Shift+G');
        return;
      }
      if (config.hotkey === 'double_ctrl' && e.key === 'Control' && !e.repeat) {
        const now = Date.now();
        if (now - lastCtrlTapRef.current < 320) {
          lastCtrlTapRef.current = 0;
          e.preventDefault();
          triggerQuickJump('双击 Ctrl');
        } else {
          lastCtrlTapRef.current = now;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    config.hotkey,
    executeJump,
    favorites,
    menuItems,
    popupOpen,
    popupQuery,
    selectedIndex,
    triggerQuickJump,
  ]);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    setCursorCoords({ x, y });
    setCursorInCanvas(true);

    const hudW = 264;
    const hudH = 38;
    const pad = config.edgePadding;
    targetHudPos.current = {
      x: Math.max(pad, Math.min(x + config.offsetX, rect.width - hudW - pad)),
      y: Math.max(pad, Math.min(y + config.offsetY, rect.height - hudH - pad)),
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1 && (config.enableMiddleClick || config.hotkey === 'mbutton')) {
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      openCursorMenuAt(e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  const focusExplorer = (id: string) => {
    setExplorers((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, lastFocusedAt: Date.now() } : exp))
    );
  };

  const changeExplorerPath = (id: string, newPath: string) => {
    setExplorers((prev) =>
      prev.map((exp) =>
        exp.id === id ? { ...exp, path: newPath, lastFocusedAt: Date.now() } : exp
      )
    );
  };

  const toggleSecondExplorer = () => {
    setExplorers((prev) => {
      if (prev.length > 1) {
        return [prev[0]];
      }
      return [
        ...prev,
        {
          id: 'exp-2',
          title: '文件资源管理器 #2',
          path: 'E:\\Work\\2026_Q4_Reports',
          lastFocusedAt: Date.now() - 100,
          x: 42,
          y: 298,
        },
      ];
    });
  };

  const dialogFolderNode = getFolderDisplay(dialogPath);
  const hotkeyMeta = HOTKEY_LABELS[config.hotkey];
  const isDarkHud = config.hudTheme === 'dark';

  const quickNavPaths = useMemo(() => {
    const base = [
      'D:\\Projects\\DesignAssets\\2026_Brand',
      'E:\\Work\\2026_Q4_Reports',
      'C:\\Users\\Admin\\Downloads',
      'D:\\Media\\Exports\\FinalCut',
      'C:\\Users\\Admin\\Desktop',
    ];
    for (const fav of favorites) {
      if (!base.includes(fav.path)) base.push(fav.path);
    }
    return base.slice(0, 6);
  }, [favorites]);

  return (
    <div className="space-y-5">
      {/* Control Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">跟随模式</span>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { id: 'smooth_follow_hud', label: '实时鼠标跟随' },
                  { id: 'popup_at_cursor', label: '热键指针弹出' },
                  { id: 'dialog_bottom_dock', label: '对话框底部吸附' },
                ] as { id: FollowMode; label: string }[]
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => onUpdateConfig({ followMode: mode.id })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    config.followMode === mode.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">触发策略</span>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { id: 'smart_switch', label: '智能切换' },
                  { id: 'always_menu', label: '始终弹菜单' },
                  { id: 'always_direct', label: '静默直达' },
                ] as { id: TriggerBehavior; label: string }[]
              ).map((beh) => (
                <button
                  key={beh.id}
                  type="button"
                  onClick={() => onUpdateConfig({ triggerBehavior: beh.id })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    config.triggerBehavior === beh.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {beh.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={toggleSecondExplorer}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {explorers.length > 1 ? '关闭第 2 个资源管理器' : '打开第 2 个资源管理器'}
          </button>
          <button
            type="button"
            onClick={() => triggerQuickJump(hotkeyMeta.keys.join('+'))}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>立即触发</span>
            <span className="font-mono text-[11px] opacity-90">{hotkeyMeta.keys.join('+')}</span>
          </button>
        </div>
      </div>

      {/* Interactive Windows Desktop Sandbox */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/80">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-medium text-slate-800">模拟 Windows 桌面环境</span>
            <span aria-hidden="true">·</span>
            <span>移动鼠标观察跟随效果，按下</span>
            <span className="inline-flex items-center gap-1">
              {hotkeyMeta.keys.map((k, idx) => (
                <kbd key={`${k}-${idx}`} className="kbd-key">
                  {k}
                </kbd>
              ))}
            </span>
            <span>或点击鼠标中键即可快速切换目录</span>
          </div>
          <div className="text-xs font-mono text-slate-500 tabular-nums">
            指针 X:{cursorCoords.x} / Y:{cursorCoords.y} · 活跃窗口:{explorers.length} 个资源管理器
          </div>
        </div>

        <div
          ref={canvasRef}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={() => setCursorInCanvas(false)}
          onMouseDown={handleCanvasMouseDown}
          onClick={() => {
            if (popupOpen && config.autoHideOnBlur) {
              setPopupOpen(false);
            }
          }}
          className="relative h-[560px] w-full overflow-hidden select-none"
          style={{
            backgroundColor: '#E9EFF6',
            backgroundImage:
              'radial-gradient(circle, rgba(148, 163, 184, 0.28) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          {/* Simulated File Explorer Windows (Left Column) */}
          <div className="absolute left-5 top-5 bottom-5 w-[44%] min-w-[330px] max-w-[440px] flex flex-col gap-4 z-10">
            {explorers.map((exp) => {
              const isPrimary = primaryExplorer?.id === exp.id;
              const node = getFolderDisplay(exp.path);
              return (
                <div
                  key={exp.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    focusExplorer(exp.id);
                    setDialogFocused(false);
                  }}
                  className={`flex-1 min-h-0 bg-white rounded-lg border transition-colors flex flex-col overflow-hidden ${
                    isPrimary
                      ? 'border-blue-400 shadow-sm'
                      : 'border-slate-300/90 opacity-95 hover:opacity-100'
                  }`}
                >
                  {/* Explorer Titlebar */}
                  <div
                    className={`px-3 py-2 border-b flex items-center justify-between gap-2 ${
                      isPrimary ? 'bg-blue-50/70 border-blue-100' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FolderOpen
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isPrimary ? 'text-blue-600' : 'text-amber-500'
                        }`}
                      />
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {exp.title}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 whitespace-nowrap shrink-0">
                      {isPrimary ? '最近活跃源目录' : '点击设为活跃源'}
                    </span>
                  </div>

                  {/* Explorer Address Bar */}
                  <div className="px-3 py-1.5 border-b border-slate-100 bg-white flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 shrink-0">路径</span>
                    <span className="font-mono text-[11px] text-slate-700 truncate">
                      {exp.path}
                    </span>
                  </div>

                  {/* Explorer Body: Quick Sidebar + File Listing */}
                  <div className="flex-1 min-h-0 flex">
                    <div className="w-[122px] border-r border-slate-100 bg-slate-50/60 p-1.5 overflow-y-auto space-y-0.5 shrink-0">
                      {quickNavPaths.map((p) => {
                        const itemNode = getFolderDisplay(p);
                        const active = exp.path === p;
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              changeExplorerPath(exp.id, p);
                            }}
                            className={`w-full text-left px-2 py-1 rounded text-[11px] truncate transition-colors cursor-pointer ${
                              active
                                ? 'bg-blue-600 text-white font-medium'
                                : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                            }`}
                          >
                            {itemNode.name}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex-1 p-2 overflow-y-auto space-y-1">
                      {node.files.map((f) => (
                        <div
                          key={f.name}
                          className="flex items-center justify-between gap-2 px-2 py-1 rounded hover:bg-slate-50 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {getFileIcon(f.name, f.kind)}
                            <span className="text-slate-700 truncate">{f.name}</span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 tabular-nums shrink-0">
                            {f.size}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Simulated Win32 Open/Save File Dialog (#32770) on the Right */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setDialogFocused(true);
            }}
            className="absolute right-5 top-7 w-[51%] min-w-[380px] max-w-[530px] z-20"
          >
            <div
              className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${
                dialogFlash
                  ? 'border-blue-600 ring-4 ring-blue-500/20 shadow-lg'
                  : dialogFocused
                  ? 'border-slate-300 shadow-md'
                  : 'border-slate-300/80 shadow-xs'
              }`}
            >
              {/* Dialog Titlebar */}
              <div className="px-4 py-2.5 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold truncate">
                    另存为 — 标准文件对话框 (#32770)
                  </span>
                </div>
                <span className="text-[11px] text-slate-300 font-mono whitespace-nowrap shrink-0">
                  {dialogFocused ? '已聚焦 · 可按 Ctrl+G' : '点击聚焦对话框'}
                </span>
              </div>

              {/* Dialog Address Bar */}
              <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center gap-2.5">
                <span className="text-xs font-medium text-slate-500 shrink-0">当前位置</span>
                <div
                  className={`flex-1 min-w-0 px-2.5 py-1.5 rounded-md border font-mono text-xs truncate transition-colors ${
                    dialogFlash
                      ? 'bg-blue-50 border-blue-500 text-blue-900 font-medium'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  {dialogPath}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDialogPath('C:\\Users\\Admin\\Documents');
                    setDialogFilename('homepage_hero_v3.png');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-200/70 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  重置
                </button>
              </div>

              {/* Dialog File List */}
              <div className="p-3 h-[242px] overflow-y-auto bg-white">
                <div className="grid grid-cols-12 px-2 pb-1.5 mb-1 border-b border-slate-100 text-[11px] font-medium text-slate-400">
                  <span className="col-span-7">名称</span>
                  <span className="col-span-3">修改日期</span>
                  <span className="col-span-2 text-right">大小</span>
                </div>
                <div className="space-y-0.5">
                  {dialogFolderNode.files.map((file) => (
                    <div
                      key={file.name}
                      className="grid grid-cols-12 items-center px-2 py-1.5 rounded hover:bg-slate-50 text-xs"
                    >
                      <div className="col-span-7 flex items-center gap-2 min-w-0 pr-2">
                        {getFileIcon(file.name, file.kind)}
                        <span className="text-slate-800 truncate">{file.name}</span>
                      </div>
                      <span className="col-span-3 font-mono text-[11px] text-slate-500 tabular-nums">
                        {file.modified}
                      </span>
                      <span className="col-span-2 text-right font-mono text-[11px] text-slate-500 tabular-nums">
                        {file.size}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dialog Bottom Input (Edit1) */}
              <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 space-y-2.5">
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="sim-filename"
                    className="text-xs font-medium text-slate-600 w-16 shrink-0"
                  >
                    文件名(N):
                  </label>
                  <input
                    id="sim-filename"
                    type="text"
                    value={dialogFilename}
                    onChange={(e) => setDialogFilename(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-500">
                    {config.preserveFilename
                      ? '跳转目录时将自动保留上方文件名'
                      : '当前设置为跳转后清空文件名'}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        showToastNearCursor(
                          `已保存到 ${dialogPath}\\${dialogFilename || 'untitled'}`,
                          cursorCoords.x,
                          cursorCoords.y
                        );
                      }}
                      className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                    >
                      保存(S)
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerQuickJump('弹窗按钮', true);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                    >
                      快速切换目录
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mode 3: Listary-Style Dialog Bottom Dock */}
            {config.followMode === 'dialog_bottom_dock' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className={`mt-2 rounded-lg border px-3 py-2 flex items-center justify-between gap-2 shadow-sm ${
                  isDarkHud
                    ? 'bg-[#141821] border-slate-700 text-slate-100'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] font-semibold text-blue-500 shrink-0">
                    QuickJump
                  </span>
                  <span
                    className={`text-xs truncate ${
                      isDarkHud ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {primaryExplorer
                      ? `同步至 ${getFolderDisplay(primaryExplorer.path).name}`
                      : '选择常用目录'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {primaryExplorer && (
                    <button
                      type="button"
                      onClick={() =>
                        executeJump(primaryExplorer.path, primaryExplorer.title, '底部吸附条')
                      }
                      className="px-2.5 py-1 text-[11px] font-medium bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors cursor-pointer whitespace-nowrap"
                    >
                      一键直达
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openCursorMenuAt(cursorCoords.x, cursorCoords.y)}
                    className={`px-2 py-1 text-[11px] rounded transition-colors cursor-pointer whitespace-nowrap ${
                      isDarkHud
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    更多目录
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mode 2: Real-Time Smooth Mouse-Following Floating HUD */}
          {config.followMode === 'smooth_follow_hud' && cursorInCanvas && !popupOpen && (
            <div
              ref={hudRef}
              className={`pointer-events-none absolute left-0 top-0 z-30 rounded-lg border px-2.5 py-1.5 shadow-lg flex items-center gap-2 will-change-transform ${
                isDarkHud
                  ? 'bg-[#141821]/95 border-slate-700 text-slate-100'
                  : 'bg-white/95 border-slate-300 text-slate-900'
              }`}
              style={{ width: '264px' }}
            >
              <MousePointer2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className={isDarkHud ? 'kbd-key-dark' : 'kbd-key'}>
                {hotkeyMeta.keys.join('+')}
              </span>
              <span className="text-xs truncate flex-1">
                {primaryExplorer
                  ? `→ ${getFolderDisplay(primaryExplorer.path).name}`
                  : '打开收藏目录'}
              </span>
            </div>
          )}

          {/* Cursor-Anchored Quick Switch Popup Menu (Listary Ctrl+G Palette) */}
          {popupOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                transform: `translate3d(${popupPos.x}px, ${popupPos.y}px, 0)`,
                width: '368px',
              }}
              className={`absolute left-0 top-0 z-40 rounded-xl border shadow-2xl overflow-hidden transition-opacity duration-150 ${
                isDarkHud
                  ? 'bg-[#141821] border-slate-700 text-slate-100'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              {/* Search Header */}
              <div
                className={`px-3 py-2.5 border-b flex items-center gap-2 ${
                  isDarkHud ? 'border-slate-800 bg-[#1B2130]' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={popupQuery}
                  onChange={(e) => {
                    setPopupQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  placeholder="搜索已打开文件夹或收藏目录..."
                  className={`flex-1 bg-transparent text-xs focus:outline-none ${
                    isDarkHud
                      ? 'text-slate-100 placeholder:text-slate-400'
                      : 'text-slate-900 placeholder:text-slate-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setPopupOpen(false)}
                  aria-label="关闭切换面板"
                  className="p-0.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Menu List */}
              <div className="max-h-[224px] overflow-y-auto p-1.5 space-y-0.5">
                {menuItems.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    未匹配到相关目录
                  </div>
                ) : (
                  menuItems.map((item, idx) => {
                    const active = idx === selectedIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={() => executeJump(item.path, item.name, '跟随菜单点击')}
                        className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                          active
                            ? 'bg-blue-600 text-white'
                            : isDarkHud
                            ? 'hover:bg-slate-800 text-slate-200'
                            : 'hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.source === 'explorer' ? (
                            <FolderOpen
                              className={`w-3.5 h-3.5 shrink-0 ${
                                active ? 'text-white' : 'text-blue-400'
                              }`}
                            />
                          ) : (
                            <Star
                              className={`w-3.5 h-3.5 shrink-0 ${
                                active ? 'text-white' : 'text-amber-400'
                              }`}
                            />
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-medium truncate">{item.name}</div>
                            <div
                              className={`text-[11px] font-mono truncate ${
                                active
                                  ? 'text-blue-100'
                                  : isDarkHud
                                  ? 'text-slate-400'
                                  : 'text-slate-500'
                              }`}
                            >
                              {item.path}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-[10px] whitespace-nowrap ${
                              active
                                ? 'text-blue-100'
                                : isDarkHud
                                ? 'text-slate-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {item.badgeText}
                          </span>
                          {item.shortcutKey && (
                            <kbd
                              className={
                                active
                                  ? 'kbd-key-dark border-white/40 text-white'
                                  : isDarkHud
                                  ? 'kbd-key-dark'
                                  : 'kbd-key'
                              }
                            >
                              {item.shortcutKey}
                            </kbd>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer Hints */}
              <div
                className={`px-3 py-1.5 border-t flex items-center justify-between text-[11px] ${
                  isDarkHud
                    ? 'border-slate-800 bg-[#10141C] text-slate-400'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}
              >
                <span className="flex items-center gap-1">
                  <CornerDownLeft className="w-3 h-3" /> 回车跳转 · 1-9 直达
                </span>
                <span>Esc 关闭</span>
              </div>
            </div>
          )}

          {/* Cursor Toast Feedback */}
          {cursorToast && (
            <div
              style={{
                transform: `translate3d(${cursorToast.x}px, ${cursorToast.y}px, 0)`,
              }}
              className="pointer-events-none absolute left-0 top-0 z-50 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium shadow-lg flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate max-w-[260px]">{cursorToast.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Real Execution Log Strip */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-800">最近路径切换记录</h3>
          <span className="text-xs text-slate-500">
            实时展示 Win32 对话框路径注入与文件名保留过程
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-medium text-slate-500 bg-slate-50/50">
                <th className="py-2 px-4 w-24">时间</th>
                <th className="py-2 px-4 w-32">触发方式</th>
                <th className="py-2 px-4">跳转目标路径</th>
                <th className="py-2 px-4 w-56">执行细节</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {jumpLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="py-2 px-4 font-mono text-slate-500 tabular-nums whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-2 px-4 font-medium text-slate-800 whitespace-nowrap">
                    {log.trigger}
                  </td>
                  <td className="py-2 px-4 font-mono text-slate-700 truncate max-w-[360px]">
                    {log.targetPath}
                  </td>
                  <td className="py-2 px-4 text-slate-500 whitespace-nowrap">{log.mode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
