import React from 'react';
import { RotateCcw } from 'lucide-react';
import {
  DEFAULT_CONFIG,
  FollowMode,
  HOTKEY_LABELS,
  HotkeyPreset,
  QuickJumpConfig,
  TriggerBehavior,
} from '../types/config';

interface SettingsPanelProps {
  config: QuickJumpConfig;
  onUpdateConfig: (partial: Partial<QuickJumpConfig>) => void;
  onResetConfig: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  config,
  onUpdateConfig,
  onResetConfig,
}) => {
  const toggleTargetApp = (key: keyof QuickJumpConfig['targetApps']) => {
    onUpdateConfig({
      targetApps: {
        ...config.targetApps,
        [key]: !config.targetApps[key],
      },
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">快捷键与鼠标跟随规则</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            所有更改会实时同步到交互演示台，并直接写入导出的 Windows 原生程序代码。
          </p>
        </div>
        <button
          type="button"
          onClick={onResetConfig}
          className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          恢复默认
        </button>
      </div>

      {/* Section 1: Hotkey & Trigger Behavior */}
      <section className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">主触发热键</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              默认复刻 Listary 的 Ctrl+G。若需在浏览器内避免查找快捷键冲突，可改用 Alt+G 或双击 Ctrl。
            </p>
          </div>
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(Object.keys(HOTKEY_LABELS) as HotkeyPreset[]).map((preset) => {
              const info = HOTKEY_LABELS[preset];
              const selected = config.hotkey === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onUpdateConfig({ hotkey: preset })}
                  className={`p-3 rounded-lg border text-left transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                    selected
                      ? 'border-blue-600 bg-blue-50/50 text-slate-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="text-xs font-medium">{info.label}</span>
                  <span className="flex items-center gap-1 shrink-0">
                    {info.keys.map((k, idx) => (
                      <kbd key={`${k}-${idx}`} className="kbd-key">
                        {k}
                      </kbd>
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">触发后的跳转策略</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              决定按下热键时是立刻切换目录，还是弹出跟随鼠标的目录选择列表。
            </p>
          </div>
          <div className="md:col-span-2 space-y-2.5">
            {(
              [
                {
                  id: 'smart_switch',
                  title: '智能切换（推荐）',
                  desc: '仅打开 1 个资源管理器时静默直达；打开多个窗口时自动在鼠标旁弹出列表供选择。',
                },
                {
                  id: 'always_menu',
                  title: '始终弹出鼠标跟随菜单',
                  desc: '每次按下热键均在鼠标指针位置弹出完整切换面板（含当前打开窗口与收藏目录）。',
                },
                {
                  id: 'always_direct',
                  title: '始终静默直达最近活跃窗口',
                  desc: '不弹菜单，直接读取最近聚焦的 Windows 资源管理器路径并注入当前文件对话框。',
                },
              ] as { id: TriggerBehavior; title: string; desc: string }[]
            ).map((opt) => (
              <label
                key={opt.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  config.triggerBehavior === opt.id
                    ? 'border-blue-600 bg-blue-50/40'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="triggerBehavior"
                  checked={config.triggerBehavior === opt.id}
                  onChange={() => onUpdateConfig({ triggerBehavior: opt.id })}
                  className="mt-0.5 accent-blue-600"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-900">{opt.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: Mouse-Following Geometry & Feel */}
      <section className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">鼠标跟随定位模式</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              控制悬浮条和快捷菜单相对于鼠标指针或文件对话框的显示方式。
            </p>
          </div>
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {(
              [
                {
                  id: 'smooth_follow_hud',
                  title: '实时鼠标跟随 HUD',
                  desc: '对话框激活时，悬浮提示条平滑跟随指针移动',
                },
                {
                  id: 'popup_at_cursor',
                  title: '热键指针处弹出',
                  desc: '平时完全无打扰，仅按热键时在鼠标旁弹出',
                },
                {
                  id: 'dialog_bottom_dock',
                  title: '对话框底部吸附',
                  desc: '类似经典 Listary，紧贴打开/保存窗口底边',
                },
              ] as { id: FollowMode; title: string; desc: string }[]
            ).map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => onUpdateConfig({ followMode: mode.id })}
                className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                  config.followMode === mode.id
                    ? 'border-blue-600 bg-blue-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-semibold text-slate-900">{mode.title}</div>
                <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">{mode.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">偏移距离与平滑参数</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              避免遮挡鼠标点击热点，并在多显示器屏幕边缘自动防溢出裁剪。
            </p>
          </div>
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700">水平偏移 (Offset X)</span>
                <span className="font-mono text-slate-600 tabular-nums">{config.offsetX} px</span>
              </div>
              <input
                type="range"
                min={-40}
                max={64}
                step={2}
                value={config.offsetX}
                onChange={(e) => onUpdateConfig({ offsetX: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700">垂直偏移 (Offset Y)</span>
                <span className="font-mono text-slate-600 tabular-nums">{config.offsetY} px</span>
              </div>
              <input
                type="range"
                min={-40}
                max={64}
                step={2}
                value={config.offsetY}
                onChange={(e) => onUpdateConfig({ offsetY: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700">鼠标跟随跟手度</span>
                <span className="font-mono text-slate-600 tabular-nums">
                  {Math.round(config.followSmoothness * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.12}
                max={0.85}
                step={0.04}
                value={config.followSmoothness}
                onChange={(e) => onUpdateConfig({ followSmoothness: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>柔和缓动</span>
                <span>即时紧跟</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700">屏幕边缘安全边距</span>
                <span className="font-mono text-slate-600 tabular-nums">
                  {config.edgePadding} px
                </span>
              </div>
              <input
                type="range"
                min={4}
                max={40}
                step={2}
                value={config.edgePadding}
                onChange={(e) => onUpdateConfig({ edgePadding: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Appearance & Dialog Protection */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">交互保护与外观</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              切换保存路径时自动保留原本填好的文件名，并可选择深浅色悬浮面板主题。
            </p>
          </div>
          <div className="md:col-span-2 space-y-3">
            <label className="flex items-center justify-between gap-4 py-1 cursor-pointer">
              <div>
                <div className="text-xs font-medium text-slate-900">切换路径后自动保留原文件名</div>
                <div className="text-[11px] text-slate-500">
                  复刻 Listary 关键细节：先读取 Edit1 文件名，跳转完成后再回填
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.preserveFilename}
                onChange={(e) => onUpdateConfig({ preserveFilename: e.target.checked })}
                className="w-4 h-4 accent-blue-600"
              />
            </label>

            <label className="flex items-center justify-between gap-4 py-1 cursor-pointer">
              <div>
                <div className="text-xs font-medium text-slate-900">文件对话框内支持鼠标中键呼出</div>
                <div className="text-[11px] text-slate-500">
                  在打开/保存对话框任意空白处点击中键直接弹出指针跟随菜单
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.enableMiddleClick}
                onChange={(e) => onUpdateConfig({ enableMiddleClick: e.target.checked })}
                className="w-4 h-4 accent-blue-600"
              />
            </label>

            <label className="flex items-center justify-between gap-4 py-1 cursor-pointer">
              <div>
                <div className="text-xs font-medium text-slate-900">点击外部区域自动收起菜单</div>
                <div className="text-[11px] text-slate-500">
                  窗口失去焦点后立刻隐藏，不占用屏幕空间
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.autoHideOnBlur}
                onChange={(e) => onUpdateConfig({ autoHideOnBlur: e.target.checked })}
                className="w-4 h-4 accent-blue-600"
              />
            </label>

            <div className="pt-2 flex items-center justify-between gap-4 border-t border-slate-100">
              <span className="text-xs font-medium text-slate-900">悬浮面板配色主题</span>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => onUpdateConfig({ hudTheme: 'dark' })}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    config.hudTheme === 'dark'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Fluent 深色
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateConfig({ hudTheme: 'light' })}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    config.hudTheme === 'light'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Fluent 浅色
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Supported Windows Targets */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">适配目标窗口</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              选择原生程序在 Windows 中自动接管的窗口类型。
            </p>
          </div>
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(
              [
                {
                  key: 'win32FileDialogs',
                  label: '标准文件打开 / 保存对话框 (#32770)',
                  sub: 'Office / Photoshop / 浏览器上传等',
                },
                {
                  key: 'fileExplorer',
                  label: 'Windows 资源管理器 (CabinetWClass)',
                  sub: '按 Alt+D 快速跳转到指定目录',
                },
                {
                  key: 'modernDialogs',
                  label: '现代 WinUI / Electron 对话框',
                  sub: 'VS Code / 微信 / 飞书文件选择框',
                },
                {
                  key: 'terminalSwitch',
                  label: '终端窗口 (Windows Terminal / CMD)',
                  sub: '自动输入 cd /d "目标路径" 并执行',
                },
              ] as const
            ).map((target) => (
              <label
                key={target.key}
                className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={config.targetApps[target.key]}
                  onChange={() => toggleTargetApp(target.key)}
                  className="mt-0.5 accent-blue-600"
                />
                <div>
                  <div className="text-xs font-medium text-slate-900">{target.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{target.sub}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </section>

      <div className="text-xs text-slate-400">
        默认参数参考：偏移 ({DEFAULT_CONFIG.offsetX}px, {DEFAULT_CONFIG.offsetY}px) · 平滑度{' '}
        {Math.round(DEFAULT_CONFIG.followSmoothness * 100)}%
      </div>
    </div>
  );
};
