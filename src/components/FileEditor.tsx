import React, { useState } from 'react';
import { PromptFile } from '../types';
import {
  FileText,
  Trash2,
  Download,
  Sparkles,
  Check,
  Split,
  Copy,
  Edit3,
  ListPlus,
  Loader2,
} from 'lucide-react';
import { downloadTextFile } from '../utils/fileHelpers';

interface FileEditorProps {
  activeFile: PromptFile | null;
  onUpdateFile: (id: string, updates: Partial<PromptFile>) => void;
  onDeleteFile: (id: string) => void;
  onGenerateThisFile: (file: PromptFile) => void;
  isGenerating?: boolean;
}

export const FileEditor: React.FC<FileEditorProps> = ({
  activeFile,
  onUpdateFile,
  onDeleteFile,
  onGenerateThisFile,
  isGenerating = false,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!activeFile) {
    return (
      <div className="h-full min-h-[380px] flex flex-col items-center justify-center p-8 bg-slate-900/40 border border-slate-800 rounded-2xl text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-500 mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-slate-300">Chưa chọn file prompt</p>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Chọn một file từ danh sách bên trái hoặc tải lên loạt file mới để xem và chỉnh sửa nội dung prompt.
        </p>
      </div>
    );
  }

  const handleStartRename = () => {
    setTempName(activeFile.name);
    setIsEditingName(true);
  };

  const handleSaveRename = () => {
    let final = tempName.trim();
    if (!final) final = 'untitled_prompt.txt';
    if (!final.endsWith('.txt') && !final.includes('.')) {
      final += '.txt';
    }
    onUpdateFile(activeFile.id, { name: final, lastModified: Date.now() });
    setIsEditingName(false);
  };

  const handleEnhancePrompt = async () => {
    if (!activeFile.content.trim()) return;
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: activeFile.content }),
      });
      const data = await res.json();
      if (data.enhancedPrompt) {
        onUpdateFile(activeFile.id, {
          content: data.enhancedPrompt,
          lastModified: Date.now(),
        });
      }
    } catch (e) {
      console.error('Failed to enhance prompt', e);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleAddStyleTag = (tag: string) => {
    const current = activeFile.content.trim();
    const newContent = current ? `${current}, ${tag}` : tag;
    onUpdateFile(activeFile.id, { content: newContent, lastModified: Date.now() });
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const wordCount = activeFile.content.trim() ? activeFile.content.trim().split(/\s+/).length : 0;
  const charCount = activeFile.content.length;
  const lineCount = activeFile.content.split('\n').filter((l) => l.trim().length > 0).length;

  const styleChips = [
    'cinematic lighting',
    'hyper-realistic 8k',
    'anime style',
    'cyberpunk neon',
    'octane render 3D',
    'studio portrait',
    'watercolor painting',
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col h-full overflow-hidden shadow-xl">
      {/* File Header Bar */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <FileText className="w-4 h-4" />
          </div>

          {isEditingName ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRename();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
                autoFocus
                className="bg-slate-800 border border-amber-500 text-xs px-2.5 py-1 rounded text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
              <button
                onClick={handleSaveRename}
                className="p-1 rounded bg-amber-500 text-slate-950 hover:bg-amber-400 text-xs cursor-pointer"
                title="Lưu tên file"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <h2
                className="text-sm font-semibold text-slate-200 truncate cursor-pointer hover:text-amber-400 transition flex items-center gap-1.5"
                onClick={handleStartRename}
                title="Bấm để đổi tên file text"
              >
                {activeFile.name}
                <Edit3 className="w-3 h-3 text-slate-500 hover:text-slate-300" />
              </h2>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyPrompt}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 text-xs transition cursor-pointer flex items-center gap-1"
            title="Sao chép nội dung prompt"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="text-[11px] hidden sm:inline">{copied ? 'Đã copy' : 'Copy'}</span>
          </button>

          <button
            onClick={() => downloadTextFile(activeFile.name, activeFile.content)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 text-xs transition cursor-pointer flex items-center gap-1"
            title="Tải file text này về máy (.txt)"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[11px] hidden sm:inline">Lưu .txt</span>
          </button>

          <button
            onClick={() => onDeleteFile(activeFile.id)}
            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 text-xs transition cursor-pointer"
            title="Xóa file này"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Sub-toolbar & Quick Tools */}
      <div className="px-4 py-2 border-b border-slate-800/60 bg-slate-950/40 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          <span>
            Từ: <strong className="text-slate-200">{wordCount}</strong>
          </span>
          <span>
            Ký tự: <strong className="text-slate-200">{charCount}</strong>
          </span>
          {activeFile.splitByLine && (
            <span className="text-amber-400 font-medium">
              Số prompt: <strong>{lineCount}</strong> (theo dòng)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Split Mode Toggle */}
          <button
            onClick={() => onUpdateFile(activeFile.id, { splitByLine: !activeFile.splitByLine })}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition cursor-pointer flex items-center gap-1 ${
              activeFile.splitByLine
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Nếu file có nhiều dòng, mỗi dòng sẽ tạo ra 1 ảnh riêng biệt"
          >
            <Split className="w-3 h-3" />
            {activeFile.splitByLine ? 'Đang tách theo dòng' : '1 file = 1 prompt'}
          </button>

          {/* AI Enhancer Button */}
          <button
            onClick={handleEnhancePrompt}
            disabled={isEnhancing || !activeFile.content.trim()}
            className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/30 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            title="Sử dụng Gemini để mô tả chi tiết hơn về ánh sáng, góc máy, chất liệu"
          >
            {isEnhancing ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Đang tối ưu...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 text-amber-400" />
                Tối ưu prompt với AI
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative flex-1 p-4 bg-slate-950/20">
        <textarea
          value={activeFile.content}
          onChange={(e) =>
            onUpdateFile(activeFile.id, {
              content: e.target.value,
              lastModified: Date.now(),
            })
          }
          placeholder="Nhập hoặc dán nội dung prompt tại đây... Bạn có thể chỉnh sửa trực tiếp."
          rows={9}
          className="w-full h-full min-h-[180px] bg-transparent text-slate-100 placeholder:text-slate-600 focus:outline-none resize-none font-['JetBrains_Mono',monospace] text-xs sm:text-sm leading-relaxed"
          spellCheck={false}
        />
      </div>

      {/* Style Chips & Footer Generate Button */}
      <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
        {/* Quick Style Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-500 flex items-center gap-1 mr-1">
            <ListPlus className="w-3 h-3" />
            Gắn thêm:
          </span>
          {styleChips.map((chip) => (
            <button
              key={chip}
              onClick={() => handleAddStyleTag(chip)}
              className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 hover:border-slate-600 transition cursor-pointer active:scale-95"
            >
              +{chip}
            </button>
          ))}
        </div>

        {/* Generate Button for This File */}
        <button
          onClick={() => onGenerateThisFile(activeFile)}
          disabled={isGenerating || !activeFile.content.trim()}
          className="text-xs font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-md shadow-amber-500/20 transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 ml-auto"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Đang tạo ảnh...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Tạo ảnh cho file này
            </>
          )}
        </button>
      </div>
    </div>
  );
};
