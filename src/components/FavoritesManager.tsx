import React, { useMemo, useState } from 'react';
import { FolderPlus, Pencil, RotateCcw, Search, Trash2, Check, X } from 'lucide-react';
import { FavoriteFolder } from '../types/config';

interface FavoritesManagerProps {
  favorites: FavoriteFolder[];
  onChangeFavorites: (next: FavoriteFolder[]) => void;
  onResetFavorites: () => void;
}

export const FavoritesManager: React.FC<FavoritesManagerProps> = ({
  favorites,
  onChangeFavorites,
  onResetFavorites,
}) => {
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [shortcutKey, setShortcutKey] = useState('');
  const [group, setGroup] = useState('工作项目');
  const [formError, setFormError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<FavoriteFolder | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return favorites;
    return favorites.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.path.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q)
    );
  }, [favorites, search]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanPath = path.trim();
    const cleanKey = shortcutKey.trim();

    if (!cleanName || !cleanPath) {
      setFormError('请填写目录名称与完整 Windows 路径（例如 D:\\Projects）。');
      return;
    }
    if (cleanKey && !/^[1-9]$/.test(cleanKey)) {
      setFormError('直达数字键只能为 1 到 9 或留空。');
      return;
    }

    const updated = favorites.map((item) =>
      cleanKey && item.shortcutKey === cleanKey ? { ...item, shortcutKey: '' } : item
    );

    const newItem: FavoriteFolder = {
      id: `fav-${Date.now()}`,
      name: cleanName,
      path: cleanPath,
      shortcutKey: cleanKey,
      group: group.trim() || '自定义',
    };

    onChangeFavorites([...updated, newItem]);
    setName('');
    setPath('');
    setShortcutKey('');
    setFormError('');
  };

  const handleDelete = (id: string) => {
    onChangeFavorites(favorites.filter((item) => item.id !== id));
  };

  const startEdit = (item: FavoriteFolder) => {
    setEditingId(item.id);
    setEditDraft({ ...item });
  };

  const saveEdit = () => {
    if (!editDraft || !editDraft.name.trim() || !editDraft.path.trim()) return;
    const cleanKey = /^[1-9]$/.test(editDraft.shortcutKey.trim())
      ? editDraft.shortcutKey.trim()
      : '';
    onChangeFavorites(
      favorites.map((item) => {
        if (item.id === editDraft.id) {
          return {
            ...editDraft,
            name: editDraft.name.trim(),
            path: editDraft.path.trim(),
            group: editDraft.group.trim() || '自定义',
            shortcutKey: cleanKey,
          };
        }
        if (cleanKey && item.shortcutKey === cleanKey) {
          return { ...item, shortcutKey: '' };
        }
        return item;
      })
    );
    setEditingId(null);
    setEditDraft(null);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">常用目录收藏库</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            呼出鼠标跟随菜单后，可直接按数字键 1–9 或关键词搜索直达以下目录。
          </p>
        </div>
        <button
          type="button"
          onClick={onResetFavorites}
          className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          恢复示例目录
        </button>
      </div>

      {/* Add Favorite Form */}
      <form
        onSubmit={handleAdd}
        className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">新增快速跳转目录</h3>
          <span className="text-xs text-slate-400">将自动同步至演示沙盒与导出脚本</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-3">
            <label className="block text-xs font-medium text-slate-600 mb-1">显示名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：代码仓库"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="sm:col-span-5">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Windows 文件夹路径
            </label>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="例如：D:\Workspace\Repos"
              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">分组</label>
            <input
              type="text"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              placeholder="工作项目"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">数字直达键</label>
            <select
              value={shortcutKey}
              onChange={(e) => setShortcutKey(e.target.value)}
              className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">不绑定</option>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => (
                <option key={k} value={k}>
                  按键 {k}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-red-600">{formError}</div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            添加到目录库
          </button>
        </div>
      </form>

      {/* Favorites Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 tabular-nums">
            共 {favorites.length} 个收藏目录 · 显示 {filtered.length} 条
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="筛选名称、路径或分组..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2">
            <div className="text-sm font-medium text-slate-700">
              {favorites.length === 0 ? '暂无收藏目录' : '没有符合筛选条件的目录'}
            </div>
            <p className="text-xs text-slate-500">
              {favorites.length === 0
                ? '请在上方表单添加一个常用文件夹路径，或点击右上角恢复示例目录。'
                : '请尝试清空搜索关键词。'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-medium text-slate-500">
                  <th className="py-2.5 px-4 w-20">快捷键</th>
                  <th className="py-2.5 px-4 w-44">名称</th>
                  <th className="py-2.5 px-4">Windows 路径</th>
                  <th className="py-2.5 px-4 w-28">分组</th>
                  <th className="py-2.5 px-4 w-24 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((item) => {
                  const isEditing = editingId === item.id && editDraft;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4">
                        {isEditing ? (
                          <input
                            type="text"
                            maxLength={1}
                            value={editDraft.shortcutKey}
                            onChange={(e) =>
                              setEditDraft({ ...editDraft, shortcutKey: e.target.value })
                            }
                            className="w-10 px-1.5 py-1 text-xs font-mono border border-slate-300 rounded"
                          />
                        ) : item.shortcutKey ? (
                          <kbd className="kbd-key">{item.shortcutKey}</kbd>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </td>

                      <td className="py-2.5 px-4 font-medium text-slate-900">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editDraft.name}
                            onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                          />
                        ) : (
                          item.name
                        )}
                      </td>

                      <td className="py-2.5 px-4 font-mono text-slate-600">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editDraft.path}
                            onChange={(e) => setEditDraft({ ...editDraft, path: e.target.value })}
                            className="w-full px-2 py-1 text-xs font-mono border border-slate-300 rounded"
                          />
                        ) : (
                          <span className="break-all">{item.path}</span>
                        )}
                      </td>

                      <td className="py-2.5 px-4 text-slate-500">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editDraft.group}
                            onChange={(e) => setEditDraft({ ...editDraft, group: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                          />
                        ) : (
                          item.group
                        )}
                      </td>

                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        {isEditing ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={saveEdit}
                              aria-label="保存修改"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setEditDraft(null);
                              }}
                              aria-label="取消修改"
                              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              aria-label={`编辑 ${item.name}`}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              aria-label={`删除 ${item.name}`}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
