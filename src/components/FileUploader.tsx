import React, { useRef, useState } from 'react';
import { UploadCloud, FilePlus, Sparkles, AlertCircle, FileText } from 'lucide-react';

interface FileUploaderProps {
  onFilesAdded: (files: { name: string; content: string }[]) => void;
  onNewFile: () => void;
  onLoadSamples: () => void;
  totalFiles: number;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesAdded,
  onNewFile,
  onLoadSamples,
  totalFiles,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFileList = async (fileList: FileList) => {
    setErrorMessage(null);
    const validFiles: { name: string; content: string }[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      // Accept text files, markdown, prompt, or any plaintext
      const isText =
        file.type.startsWith('text/') ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.prompt') ||
        file.name.endsWith('.md') ||
        file.name.endsWith('.json') ||
        file.size < 2 * 1024 * 1024; // < 2MB

      if (isText) {
        try {
          const content = await file.text();
          if (content.trim()) {
            validFiles.push({
              name: file.name,
              content: content.trim(),
            });
          }
        } catch (e) {
          console.error('Failed to read file:', file.name, e);
        }
      }
    }

    if (validFiles.length > 0) {
      onFilesAdded(validFiles);
    } else {
      setErrorMessage('Không tìm thấy file văn bản hợp lệ (.txt, .md, .prompt). Vui lòng thử lại.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileList(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFileList(e.target.files);
      // Reset input value to allow re-uploading same file
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 transition-all duration-200 cursor-pointer text-center group ${
          isDragging
            ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
            : 'border-slate-700/80 hover:border-amber-500/60 bg-slate-900/40 hover:bg-slate-900/80'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".txt,.md,.prompt,.text,.json,text/plain"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              isDragging
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                : 'bg-slate-800 text-amber-400 group-hover:bg-amber-500/20 group-hover:scale-110'
            }`}
          >
            <UploadCloud className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-200 group-hover:text-amber-300 transition">
              Kéo & thả một loạt file text chứa prompt vào đây
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Hỗ trợ chọn cùng lúc nhiều file <code className="text-amber-400/90 font-mono">.txt</code>,{' '}
              <code className="text-amber-400/90 font-mono">.prompt</code>,{' '}
              <code className="text-amber-400/90 font-mono">.md</code> (hoặc bấm để chọn)
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs font-medium px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition shadow-md shadow-amber-500/20 active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Chọn nhiều file từ máy
            </button>

            <button
              type="button"
              onClick={onNewFile}
              className="text-xs font-medium px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <FilePlus className="w-3.5 h-3.5 text-sky-400" />
              Tạo file mới
            </button>

            {totalFiles === 0 && (
              <button
                type="button"
                onClick={onLoadSamples}
                className="text-xs font-medium px-3.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Thử 4 file mẫu có sẵn
              </button>
            )}
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
