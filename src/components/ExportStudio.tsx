import React, { useMemo, useState } from 'react';
import { Check, Copy, Download, FileCode2, FileJson, Terminal } from 'lucide-react';
import { FavoriteFolder, HOTKEY_LABELS, QuickJumpConfig } from '../types/config';
import {
  generateAhkV2Script,
  generateBuildBat,
  generateConfigJson,
  generatePythonScript,
} from '../utils/codeGenerators';

interface ExportStudioProps {
  config: QuickJumpConfig;
  favorites: FavoriteFolder[];
  onDownloadFile: (filename: string, content: string, mime?: string) => void;
}

type ExportTab = 'ahk' | 'python' | 'config' | 'bat';

export const ExportStudio: React.FC<ExportStudioProps> = ({
  config,
  favorites,
  onDownloadFile,
}) => {
  const [activeTab, setActiveTab] = useState<ExportTab>('ahk');
  const [copiedTab, setCopiedTab] = useState<ExportTab | null>(null);

  const files = useMemo(() => {
    return {
      ahk: {
        filename: 'QuickJump_CtrlG.ahk',
        title: 'AutoHotkey v2 原生版（推荐）',
        summary: '内存占用约 2–4 MB · 原生读取资源管理器 COM 与 #32770 对话框 · 可用 Ahk2Exe 打包单文件 EXE',
        content: generateAhkV2Script(config, favorites),
      },
      python: {
        filename: 'quickjump_app.py',
        title: 'Python 3 Win32 独立版',
        summary: '基于 pywin32 + tkinter 无边框鼠标跟随窗口 · 配套 build_exe.bat 一键编译独立 EXE',
        content: generatePythonScript(config, favorites),
      },
      config: {
        filename: 'quickjump_config.json',
        title: '配置文件 (JSON)',
        summary: '与 Python 版放于同级目录，可随时热更新热键、偏移像素与收藏路径',
        content: generateConfigJson(config, favorites),
      },
      bat: {
        filename: 'build_exe.bat',
        title: '一键打包 EXE 脚本',
        summary: '自动安装依赖并调用 PyInstaller 编译无黑框 QuickJump.exe',
        content: generateBuildBat(),
      },
    };
  }, [config, favorites]);

  const currentFile = files[activeTab];
  const lineCount = useMemo(() => currentFile.content.split('\n').length, [currentFile.content]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentFile.content);
      setCopiedTab(activeTab);
      window.setTimeout(() => setCopiedTab(null), 1800);
    } catch {
      // Fallback ignored if clipboard is restricted
    }
  };

  const handleDownloadPythonBundle = () => {
    onDownloadFile(files.python.filename, files.python.content, 'text/x-python;charset=utf-8');
    window.setTimeout(() => {
      onDownloadFile(files.config.filename, files.config.content, 'application/json;charset=utf-8');
    }, 180);
    window.setTimeout(() => {
      onDownloadFile(files.bat.filename, files.bat.content, 'text/plain;charset=utf-8');
    }, 360);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">导出可运行的 Windows 桌面程序</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            已将你当前配置的热键（{HOTKEY_LABELS[config.hotkey].keys.join('+')}）、偏移坐标（
            {config.offsetX}px, {config.offsetY}px）与 {favorites.length}{' '}
            个常用目录编译到以下原生代码中。
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleDownloadPythonBundle}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            下载 Python + EXE 打包套装
          </button>
          <button
            type="button"
            onClick={() =>
              onDownloadFile(files.ahk.filename, files.ahk.content, 'text/plain;charset=utf-8')
            }
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            下载 {files.ahk.filename}
          </button>
        </div>
      </div>

      {/* Deployment Quick Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">方案一：AutoHotkey v2（最快上手）</h3>
            <span className="text-xs text-slate-500">推荐 · 零卡顿</span>
          </div>
          <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside leading-relaxed">
            <li>
              在 Windows 安装免费的 <span className="font-mono text-slate-800">AutoHotkey v2</span>
              （官网 autohotkey.com）。
            </li>
            <li>
              点击右上角下载 <span className="font-mono text-slate-800">QuickJump_CtrlG.ahk</span>，双击即可在托盘后台常驻运行。
            </li>
            <li>
              如需发给未安装 AHK 的电脑，右键脚本选择 <span className="font-mono text-slate-800">Compile Script</span> 即可生成独立 <span className="font-mono text-slate-800">.exe</span>。
            </li>
          </ol>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">方案二：Python Win32 独立编译版</h3>
            <span className="text-xs text-slate-500">支持 JSON 热配置</span>
          </div>
          <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside leading-relaxed">
            <li>
              点击「下载 Python + EXE 打包套装」将 3 个文件保存到同一个文件夹。
            </li>
            <li>
              直接双击 <span className="font-mono text-slate-800">build_exe.bat</span>，脚本会自动安装 <span className="font-mono text-slate-800">pywin32 / keyboard</span> 并输出 <span className="font-mono text-slate-800">dist\QuickJump.exe</span>。
            </li>
            <li>
              开机自启：按 <kbd className="kbd-key">Win</kbd>+<kbd className="kbd-key">R</kbd> 输入 <span className="font-mono text-slate-800">shell:startup</span>，把快捷方式放进去即可。
            </li>
          </ol>
        </div>
      </div>

      {/* Code Viewer Workbench */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg overflow-x-auto">
            {(
              [
                { id: 'ahk', label: 'QuickJump_CtrlG.ahk', icon: FileCode2 },
                { id: 'python', label: 'quickjump_app.py', icon: FileCode2 },
                { id: 'config', label: 'quickjump_config.json', icon: FileJson },
                { id: 'bat', label: 'build_exe.bat', icon: Terminal },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs font-medium'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono text-slate-500 tabular-nums mr-1">
              {lineCount} 行
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              {copiedTab === activeTab ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  复制代码
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => onDownloadFile(currentFile.filename, currentFile.content)}
              className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              保存此文件
            </button>
          </div>
        </div>

        <div className="px-4 py-2 border-b border-slate-200 bg-white text-xs text-slate-500">
          <span className="font-medium text-slate-800">{currentFile.title}</span>
          <span className="mx-2" aria-hidden="true">
            ·
          </span>
          <span>{currentFile.summary}</span>
        </div>

        <div className="bg-[#0F172A] text-slate-100 overflow-x-auto max-h-[520px] overflow-y-auto">
          <pre className="p-5 text-xs font-mono leading-relaxed tracking-[0.01em]">
            <code>{currentFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
