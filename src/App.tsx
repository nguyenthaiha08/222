/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PromptFile, PromptTask, GenerationConfig, AspectRatio } from './types';
import { SAMPLE_PROMPT_FILES } from './utils/sampleData';
import { Header } from './components/Header';
import { FileUploader } from './components/FileUploader';
import { FileEditor } from './components/FileEditor';
import { GenerationSettings } from './components/GenerationSettings';
import { BatchProgress } from './components/BatchProgress';
import { PromptCard } from './components/PromptCard';
import { ImageLightbox } from './components/ImageLightbox';
import { ApiKeyManagerModal } from './components/ApiKeyManagerModal';
import { downloadAllImagesZip, downloadAllPromptFilesZip } from './utils/fileHelpers';
import {
  FileText,
  Plus,
  Sparkles,
  LayoutGrid,
  Edit3,
  Sliders,
  FolderOpen,
  ArrowRight,
  ChevronDown,
  Info,
  KeyRound,
} from 'lucide-react';

const STORAGE_KEY_FILES = 'nanoflow_files_v1';
const STORAGE_KEY_CONFIG = 'nanoflow_config_v1';

export default function App() {
  // Load initial files from localStorage or sample files
  const [files, setFiles] = useState<PromptFile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FILES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading files from localStorage', e);
    }
    return SAMPLE_PROMPT_FILES;
  });

  const [activeFileId, setActiveFileId] = useState<string>(() => {
    return files[0]?.id || '';
  });

  const [config, setConfig] = useState<GenerationConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading config from localStorage', e);
    }
    return {
      model: 'gemini-nano-banana-2.1',
      aspectRatio: '1:1',
      imageSize: '1K',
      stylePreset: 'none',
      negativePrompt: '',
      useImageSearch: false,
      concurrency: 1,
    };
  });

  // Prompt tasks derived from files
  const [tasks, setTasks] = useState<PromptTask[]>([]);
  const [isRunningQueue, setIsRunningQueue] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'error'>('all');
  const [activeLightboxTask, setActiveLightboxTask] = useState<PromptTask | null>(null);
  const [keyPool, setKeyPool] = useState<{
    totalKeys: number;
    currentIndex: number;
    currentMasked: string;
    autoRotate: boolean;
  } | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [isKeyManagerOpen, setIsKeyManagerOpen] = useState(false);
  const stopQueueRef = useRef(false);

  const handleKeysSaved = (savedKeys: string[]) => {
    fetchStatus();
  };

  // Fetch status and key pool information
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (data.keyPool) {
        setKeyPool(data.keyPool);
      }
    } catch (e) {
      console.warn('Failed to fetch status', e);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Sync files to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(files));
    } catch (e) {
      console.error('Failed to save files', e);
    }
  }, [files]);

  // Sync config to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save config', e);
    }
  }, [config]);

  // Sync tasks when files change
  useEffect(() => {
    setTasks((prevTasks) => {
      const prevMap = new Map<string, PromptTask>();
      prevTasks.forEach((t) => prevMap.set(t.id, t));

      const newTasks: PromptTask[] = [];

      files.forEach((file) => {
        if (file.splitByLine) {
          const lines = file.content
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 0);

          if (lines.length === 0) {
            const taskId = `${file.id}-0`;
            const existing = prevMap.get(taskId);
            newTasks.push(
              existing || {
                id: taskId,
                fileId: file.id,
                fileName: file.name,
                prompt: '',
                indexInFile: 0,
                status: 'idle',
              }
            );
          } else {
            lines.forEach((line, idx) => {
              const taskId = `${file.id}-${idx}`;
              const existing = prevMap.get(taskId);
              newTasks.push({
                ...(existing || {
                  id: taskId,
                  status: 'idle',
                }),
                fileId: file.id,
                fileName: `${file.name} [#${idx + 1}]`,
                prompt: line,
                indexInFile: idx,
              });
            });
          }
        } else {
          const taskId = `${file.id}-single`;
          const existing = prevMap.get(taskId);
          newTasks.push({
            ...(existing || {
              id: taskId,
              status: 'idle',
            }),
            fileId: file.id,
            fileName: file.name,
            prompt: file.content,
            indexInFile: 0,
          });
        }
      });

      return newTasks;
    });
  }, [files]);

  // Active file object
  const activeFile = useMemo(() => {
    return files.find((f) => f.id === activeFileId) || files[0] || null;
  }, [files, activeFileId]);

  // Handler: Add files from uploader
  const handleFilesAdded = (newUploaded: { name: string; content: string }[]) => {
    const created: PromptFile[] = newUploaded.map((f, i) => ({
      id: `file-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      name: f.name,
      content: f.content,
      lastModified: Date.now(),
      splitByLine: false,
    }));

    setFiles((prev) => [...created, ...prev]);
    if (created.length > 0) {
      setActiveFileId(created[0].id);
    }
    setShowUploader(false);
  };

  // Handler: Create new empty text file
  const handleCreateNewFile = () => {
    const count = files.length + 1;
    const newFile: PromptFile = {
      id: `file-${Date.now()}`,
      name: `prompt_${count}.txt`,
      content: 'Nhập nội dung prompt tại đây...',
      lastModified: Date.now(),
      splitByLine: false,
    };
    setFiles((prev) => [newFile, ...prev]);
    setActiveFileId(newFile.id);
  };

  // Handler: Update file
  const handleUpdateFile = (id: string, updates: Partial<PromptFile>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  // Handler: Delete file
  const handleDeleteFile = (id: string) => {
    setFiles((prev) => {
      const remaining = prev.filter((f) => f.id !== id);
      if (activeFileId === id && remaining.length > 0) {
        setActiveFileId(remaining[0].id);
      }
      return remaining;
    });
  };

  // Handler: Reset/Load sample prompt files
  const handleLoadSamples = () => {
    setFiles(SAMPLE_PROMPT_FILES);
    setActiveFileId(SAMPLE_PROMPT_FILES[0].id);
  };

  // Handler: Clear all
  const handleResetAll = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách file và ảnh đã tạo không?')) {
      setFiles([]);
      setTasks([]);
      setActiveFileId('');
    }
  };

  // Generate single task
  const generateTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.prompt.trim()) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'generating', errorMessage: undefined } : t))
    );

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: task.prompt,
          model: config.model,
          aspectRatio: config.aspectRatio,
          imageSize: config.imageSize,
          stylePreset: config.stylePreset,
          negativePrompt: config.negativePrompt,
          useImageSearch: config.useImageSearch,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Lỗi khi tạo ảnh');
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: 'completed',
                imageUrl: data.imageUrl,
                modelUsed: data.modelUsed,
                aspectRatio: data.aspectRatio,
                imageSize: data.imageSize,
                generatedAt: data.timestamp,
                keyUsed: data.keyUsed,
                errorMessage: undefined,
              }
            : t
        )
      );

      // Refresh key pool status if key rotated
      if (data.keyUsed?.rotated) {
        fetchStatus();
      }
    } catch (err: any) {
      console.error('Task generation error:', err);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: 'error',
                errorMessage: err?.message || 'Không thể tạo ảnh từ model.',
              }
            : t
        )
      );
    }
  };

  // Generate for current active file
  const handleGenerateThisFile = async (file: PromptFile) => {
    const fileTasks = tasks.filter((t) => t.fileId === file.id);
    for (const t of fileTasks) {
      await generateTask(t.id);
    }
  };

  // Batch Queue runner
  const runBatchQueue = async (taskSubset: PromptTask[]) => {
    if (taskSubset.length === 0) return;

    setIsRunningQueue(true);
    stopQueueRef.current = false;

    for (let i = 0; i < taskSubset.length; i++) {
      if (stopQueueRef.current) {
        break;
      }
      const t = taskSubset[i];
      await generateTask(t.id);

      // Brief delay between batch items to prevent aggressive rate throttling
      if (i < taskSubset.length - 1 && !stopQueueRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }

    setIsRunningQueue(false);
  };

  // Batch action: Generate All
  const handleStartAll = () => {
    runBatchQueue(tasks);
  };

  // Batch action: Generate Pending Only
  const handleStartPending = () => {
    const pendingTasks = tasks.filter((t) => t.status !== 'completed');
    runBatchQueue(pendingTasks);
  };

  // Batch action: Stop queue
  const handleStopQueue = () => {
    stopQueueRef.current = true;
    setIsRunningQueue(false);
  };

  // Counts for batch progress
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const errorCount = tasks.filter((t) => t.status === 'error').length;
  const generatingCount = tasks.filter((t) => t.status === 'generating').length;
  const pendingCount = tasks.filter((t) => t.status === 'idle' || t.status === 'queued').length;

  // Filtered tasks for grid
  const filteredTasks = useMemo(() => {
    if (filter === 'completed') return tasks.filter((t) => t.status === 'completed');
    if (filter === 'pending')
      return tasks.filter((t) => t.status === 'idle' || t.status === 'queued' || t.status === 'generating');
    if (filter === 'error') return tasks.filter((t) => t.status === 'error');
    return tasks;
  }, [tasks, filter]);

  // Lightbox Navigation index
  const completedTasksList = useMemo(() => tasks.filter((t) => t.status === 'completed'), [tasks]);
  const currentLightboxIndex = activeLightboxTask
    ? completedTasksList.findIndex((t) => t.id === activeLightboxTask.id)
    : -1;

  const handleNextLightbox = () => {
    if (currentLightboxIndex >= 0 && currentLightboxIndex < completedTasksList.length - 1) {
      setActiveLightboxTask(completedTasksList[currentLightboxIndex + 1]);
    }
  };

  const handlePrevLightbox = () => {
    if (currentLightboxIndex > 0) {
      setActiveLightboxTask(completedTasksList[currentLightboxIndex - 1]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* App Header */}
      <Header
        totalFiles={files.length}
        totalPrompts={tasks.length}
        completedImages={completedCount}
        keyPool={keyPool}
        onLoadSamples={handleLoadSamples}
        onResetAll={handleResetAll}
        onOpenKeyManager={() => setIsKeyManagerOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner with Google Nano Banana 2.1 specs */}
        <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/20 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  Tạo ảnh hàng loạt với Google Nano Banana 2.1
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                  Google Flow
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Gửi cùng lúc nhiều file text chứa prompt, chỉnh sửa trực tiếp nội dung file trên app, và sinh ảnh chất lượng cao 1K / 2K / 4K.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsKeyManagerOpen(true)}
              className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
              title="Mở bảng quản lý API Key Manager"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              API Key Manager
            </button>

            <button
              onClick={() => setShowUploader(!showUploader)}
              className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              {showUploader ? 'Đóng tải file' : 'Tải thêm loạt file text (.txt)'}
            </button>

            <button
              onClick={handleCreateNewFile}
              className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-sky-400" />
              Tạo file mới
            </button>
          </div>
        </div>

        {/* Collapsible File Uploader */}
        {(showUploader || files.length === 0) && (
          <div className="animate-in fade-in duration-200">
            <FileUploader
              onFilesAdded={handleFilesAdded}
              onNewFile={handleCreateNewFile}
              onLoadSamples={handleLoadSamples}
              totalFiles={files.length}
            />
          </div>
        )}

        {/* Configuration Bar */}
        <GenerationSettings
          config={config}
          onChangeConfig={(newCfg) => setConfig((prev) => ({ ...prev, ...newCfg }))}
        />

        {/* Main 2-Column Split: Left = Files & Prompt Editor, Right = Batch Queue & Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: File Tabs & Text Editor (5 columns) */}
          <div className="lg:col-span-5 space-y-4">
            {/* File List / Selector Bar */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  Danh sách file text prompt ({files.length})
                </span>
                <button
                  onClick={handleCreateNewFile}
                  className="text-[11px] font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  Thêm file
                </button>
              </div>

              {/* Scrollable list of files */}
              <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
                {files.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => setActiveFileId(file.id)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                      activeFileId === file.id
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 font-semibold shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className={`w-3.5 h-3.5 shrink-0 ${activeFileId === file.id ? 'text-amber-400' : 'text-slate-500'}`} />
                      <span className="truncate font-mono">{file.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {file.content.length} ký tự
                      </span>
                      {activeFileId === file.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* In-app Text File Editor */}
            <FileEditor
              activeFile={activeFile}
              onUpdateFile={handleUpdateFile}
              onDeleteFile={handleDeleteFile}
              onGenerateThisFile={handleGenerateThisFile}
              isGenerating={tasks.some((t) => t.fileId === activeFile?.id && t.status === 'generating')}
            />
          </div>

          {/* Right Column: Batch Progress & Prompt Image Grid (7 columns) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Batch Progress Bar & Queue Controller */}
            <BatchProgress
              total={tasks.length}
              completed={completedCount}
              errors={errorCount}
              generating={generatingCount}
              pending={pendingCount}
              isRunningQueue={isRunningQueue}
              onStartAll={handleStartAll}
              onStartPending={handleStartPending}
              onStopQueue={handleStopQueue}
              onDownloadAllImagesZip={() => downloadAllImagesZip(tasks)}
              onDownloadAllPromptFilesZip={() => downloadAllPromptFilesZip(files)}
              filter={filter}
              onFilterChange={setFilter}
            />

            {/* Grid of Prompt Cards */}
            {filteredTasks.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 mx-auto flex items-center justify-center text-slate-500">
                  <LayoutGrid className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-300">Không có prompt nào trong mục này</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Hãy chọn bộ lọc khác hoặc tải thêm file text chứa prompt để bắt đầu sinh ảnh.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredTasks.map((task) => (
                  <PromptCard
                    key={task.id}
                    task={task}
                    onGenerate={generateTask}
                    onOpenLightbox={(t) => setActiveLightboxTask(t)}
                    onEditPrompt={(fId) => setActiveFileId(fId)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Lightbox Modal for High-Resolution View */}
      <ImageLightbox
        task={activeLightboxTask}
        onClose={() => setActiveLightboxTask(null)}
        onNext={handleNextLightbox}
        onPrev={handlePrevLightbox}
        hasNext={currentLightboxIndex >= 0 && currentLightboxIndex < completedTasksList.length - 1}
        hasPrev={currentLightboxIndex > 0}
      />

      {/* API Key Manager Modal (Mirrors user mockup) */}
      <ApiKeyManagerModal
        isOpen={isKeyManagerOpen}
        onClose={() => setIsKeyManagerOpen(false)}
        onKeysSaved={handleKeysSaved}
      />

      {/* Subtle Studio Footer */}
      <footer className="mt-auto border-t border-slate-800/60 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>NanoFlow Studio • Google Nano Banana 2.1 Image Generation Engine</span>
          <span className="font-mono text-slate-400">1K / 2K / 4K Ultra High-Fidelity Rendering</span>
        </div>
      </footer>
    </div>
  );
}
