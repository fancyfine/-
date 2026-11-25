import React, { useCallback, useEffect, useState } from 'react';
import {
  Code2,
  Download,
  Menu,
  MousePointer2,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react';
import { DesktopSimulator } from './components/DesktopSimulator';
import { ExportStudio } from './components/ExportStudio';
import { FavoritesManager } from './components/FavoritesManager';
import { SettingsPanel } from './components/SettingsPanel';
import {
  DEFAULT_CONFIG,
  DEFAULT_FAVORITES,
  FavoriteFolder,
  HOTKEY_LABELS,
  NavSection,
  QuickJumpConfig,
} from './types/config';
import { generateAhkV2Script } from './utils/codeGenerators';

const STORAGE_CONFIG_KEY = 'quickjump_config_v1';
const STORAGE_FAVS_KEY = 'quickjump_favorites_v1';

const NAV_ITEMS: { id: NavSection; label: string; description: string }[] = [
  { id: 'simulator', label: '交互演示台', description: '实时体验 Ctrl+G 与鼠标跟随' },
  { id: 'settings', label: '跟随与快捷键', description: '热键、偏移与跟随规则' },
  { id: 'favorites', label: '常用目录库', description: '管理 1–9 数字直达路径' },
  { id: 'export', label: '导出 Windows 程序', description: '生成 .ahk / .py 与 EXE 脚本' },
];

const FOLLOW_MODE_NAMES: Record<QuickJumpConfig['followMode'], string> = {
  smooth_follow_hud: '实时鼠标跟随 HUD',
  popup_at_cursor: '热键指针处弹出',
  dialog_bottom_dock: '对话框底部吸附',
};

function loadStoredConfig(): QuickJumpConfig {
  try {
    const raw = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      targetApps: {
        ...DEFAULT_CONFIG.targetApps,
        ...(parsed.targetApps || {}),
      },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function loadStoredFavorites(): FavoriteFolder[] {
  try {
    const raw = localStorage.getItem(STORAGE_FAVS_KEY);
    if (!raw) return DEFAULT_FAVORITES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_FAVORITES;
  } catch {
    return DEFAULT_FAVORITES;
  }
}

export default function App() {
  const [activeNav, setActiveNav] = useState<NavSection>('simulator');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [config, setConfig] = useState<QuickJumpConfig>(loadStoredConfig);
  const [favorites, setFavorites] = useState<FavoriteFolder[]>(loadStoredFavorites);
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
    } catch {
      // Ignore storage quota errors
    }
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FAVS_KEY, JSON.stringify(favorites));
    } catch {
      // Ignore storage quota errors
    }
  }, [favorites]);

  const handleUpdateConfig = useCallback((partial: Partial<QuickJumpConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleDownloadFile = useCallback(
    (filename: string, content: string, mime = 'text/plain;charset=utf-8') => {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadFeedback(`已导出 ${filename}`);
      window.setTimeout(() => setDownloadFeedback(null), 2400);
    },
    []
  );

  const handleQuickDownloadAhk = () => {
    const script = generateAhkV2Script(config, favorites);
    handleDownloadFile('QuickJump_CtrlG.ahk', script, 'text/plain;charset=utf-8');
  };

  const activeSectionMeta = NAV_ITEMS.find((item) => item.id === activeNav) || NAV_ITEMS[0];

  const renderNavIcon = (id: NavSection, isActive: boolean) => {
    const cls = `w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`;
    if (id === 'simulator') return <MousePointer2 className={cls} />;
    if (id === 'settings') return <SlidersHorizontal className={cls} />;
    if (id === 'favorites') return <Star className={cls} />;
    return <Code2 className={cls} />;
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#0F172A]">
      {/* Mobile Sidebar Backdrop */}
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 bg-slate-900/30 z-40 lg:hidden"
        />
      )}

      {/* Left Sidebar (248px Workspace Rail) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[248px] bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-14 px-5 border-b border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveNav('simulator')}
            className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            QuickJump
          </button>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="关闭侧边栏"
            className="p-1 text-slate-500 hover:text-slate-800 lg:hidden cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveNav(item.id);
                  setMobileNavOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors cursor-pointer ${
                  active
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
                }`}
              >
                {renderNavIcon(item.id, active)}
                <span className="text-sm whitespace-nowrap truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quiet Configuration Summary Footer */}
        <div className="p-4 border-t border-slate-200 space-y-2 text-xs">
          <div className="text-slate-400 font-medium">当前生效配置</div>
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-slate-500">触发热键</span>
            <span className="font-mono font-medium">
              {HOTKEY_LABELS[config.hotkey].keys.join('+')}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-slate-500">跟随方式</span>
            <span className="truncate max-w-[120px]">{FOLLOW_MODE_NAMES[config.followMode]}</span>
          </div>
          <div className="flex items-center justify-between text-slate-700 tabular-nums">
            <span className="text-slate-500">常用目录</span>
            <span className="font-mono">{favorites.length} 个</span>
          </div>
        </div>
      </aside>

      {/* Right Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Breadcrumb Bar */}
        <header className="h-14 bg-white border-b border-slate-200 px-5 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="打开导航菜单"
              className="p-1.5 -ml-1.5 text-slate-600 hover:text-slate-900 lg:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-400 whitespace-nowrap">QuickJump</span>
              <span className="text-slate-300" aria-hidden="true">
                /
              </span>
              <span className="font-semibold text-slate-900 truncate">
                {activeSectionMeta.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {downloadFeedback && (
              <span className="hidden sm:inline text-xs font-medium text-emerald-700">
                {downloadFeedback}
              </span>
            )}
            <button
              type="button"
              onClick={handleQuickDownloadAhk}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              下载 .ahk 程序
            </button>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 p-5 lg:p-8 max-w-[1280px] w-full mx-auto">
          {activeNav === 'simulator' && (
            <DesktopSimulator
              config={config}
              favorites={favorites}
              onUpdateConfig={handleUpdateConfig}
            />
          )}

          {activeNav === 'settings' && (
            <SettingsPanel
              config={config}
              onUpdateConfig={handleUpdateConfig}
              onResetConfig={() => setConfig(DEFAULT_CONFIG)}
            />
          )}

          {activeNav === 'favorites' && (
            <FavoritesManager
              favorites={favorites}
              onChangeFavorites={setFavorites}
              onResetFavorites={() => setFavorites(DEFAULT_FAVORITES)}
            />
          )}

          {activeNav === 'export' && (
            <ExportStudio
              config={config}
              favorites={favorites}
              onDownloadFile={handleDownloadFile}
            />
          )}
        </main>
      </div>
    </div>
  );
}
