import React from 'react';
import { AspectRatio, GenerationConfig, ImageSize } from '../types';
import { Sliders, Ratio, Maximize2, Palette, ShieldAlert, Globe, Zap } from 'lucide-react';

interface GenerationSettingsProps {
  config: GenerationConfig;
  onChangeConfig: (newConfig: Partial<GenerationConfig>) => void;
}

export const GenerationSettings: React.FC<GenerationSettingsProps> = ({
  config,
  onChangeConfig,
}) => {
  const aspectRatios: { value: AspectRatio; label: string; iconRatio: string }[] = [
    { value: '1:1', label: '1:1 Vuông', iconRatio: 'w-4 h-4' },
    { value: '16:9', label: '16:9 Ngang', iconRatio: 'w-5 h-3' },
    { value: '9:16', label: '9:16 Dọc/Story', iconRatio: 'w-3 h-5' },
    { value: '4:3', label: '4:3 Tiêu chuẩn', iconRatio: 'w-4 h-3' },
    { value: '3:4', label: '3:4 Chân dung', iconRatio: 'w-3 h-4' },
    { value: '4:1', label: '4:1 Toàn cảnh', iconRatio: 'w-6 h-2' },
    { value: '1:4', label: '1:4 Banner dài', iconRatio: 'w-2 h-6' },
  ];

  const imageSizes: { value: ImageSize; label: string; desc: string }[] = [
    { value: '1K', label: '1K (1024px)', desc: 'Tốc độ nhanh, ổn định' },
    { value: '2K', label: '2K (2048px)', desc: 'Độ nét cao, chi tiết sâu' },
    { value: '4K', label: '4K (4096px)', desc: 'Siêu nét, chất lượng tối đa' },
  ];

  const stylePresets = [
    { value: 'none', label: 'Không ép phong cách (Gốc)' },
    { value: 'cinematic', label: '🎬 Cinematic Dramatic' },
    { value: 'photorealistic', label: '📸 Photorealistic 85mm' },
    { value: 'anime', label: '🌸 Anime Studio Ghibli' },
    { value: 'cyberpunk', label: '🌃 Cyberpunk Neon' },
    { value: 'digital_art', label: '🎨 Digital Art Masterpiece' },
    { value: 'watercolor', label: '🖌️ Tranh màu nước mềm mại' },
    { value: '3d_render', label: '🧊 3D Octane Render' },
    { value: 'vintage', label: '🎞️ Vintage Film 35mm' },
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-slate-200">Cấu hình mô hình & Tạo ảnh</h3>
        </div>
        <span className="text-[11px] font-mono text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          Google Flow • Nano Banana 2.1
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Model Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Mô hình sinh ảnh (Model)
          </label>
          <select
            value={config.model}
            onChange={(e) => onChangeConfig({ model: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="gemini-nano-banana-2.1">Google Nano Banana 2.1 (Mặc định)</option>
            <option value="gemini-3.1-flash-lite-image">Nano Banana Lite (Siêu tốc)</option>
            <option value="gemini-3-pro-image">Nano Banana Pro (Nâng cao)</option>
          </select>
          <p className="text-[10px] text-slate-500">
            Hỗ trợ độ phân giải 1K/2K/4K và tỷ lệ khung hình tùy chỉnh.
          </p>
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Ratio className="w-3.5 h-3.5 text-sky-400" />
            Tỷ lệ khung hình (Aspect Ratio)
          </label>
          <select
            value={config.aspectRatio}
            onChange={(e) => onChangeConfig({ aspectRatio: e.target.value as AspectRatio })}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer font-mono"
          >
            {aspectRatios.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1 pt-1 overflow-x-auto pb-0.5">
            {aspectRatios.slice(0, 5).map((r) => (
              <button
                key={r.value}
                onClick={() => onChangeConfig({ aspectRatio: r.value })}
                className={`px-2 py-0.5 rounded text-[10px] font-mono border transition ${
                  config.aspectRatio === r.value
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                    : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-slate-200'
                }`}
              >
                {r.value}
              </button>
            ))}
          </div>
        </div>

        {/* Image Size / Resolution */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
            Độ phân giải (Image Size)
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {imageSizes.map((s) => (
              <button
                key={s.value}
                onClick={() => onChangeConfig({ imageSize: s.value })}
                className={`px-2 py-2 rounded-xl text-center text-xs font-semibold border transition cursor-pointer flex flex-col items-center justify-center ${
                  config.imageSize === s.value
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{s.value}</span>
                <span className="text-[9px] font-normal opacity-70">
                  {s.value === '1K' ? '1024' : s.value === '2K' ? '2048' : '4096'}
                </span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-500">Áp dụng cho Nano Banana 2.1 & Pro</p>
        </div>

        {/* Style Preset */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-purple-400" />
            Phong cách chung (Style Preset)
          </label>
          <select
            value={config.stylePreset}
            onChange={(e) => onChangeConfig({ stylePreset: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            {stylePresets.map((sp) => (
              <option key={sp.value} value={sp.value}>
                {sp.label}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-500">Tự động gắn thêm vào prompt khi tạo ảnh</p>
        </div>
      </div>

      {/* Advanced Row: Negative Prompt & Google Image Search Grounding */}
      <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="md:col-span-2 space-y-1">
          <label className="font-semibold text-slate-300 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            Prompt loại trừ (Negative Prompt - Những gì không muốn xuất hiện)
          </label>
          <input
            type="text"
            value={config.negativePrompt}
            onChange={(e) => onChangeConfig({ negativePrompt: e.target.value })}
            placeholder="Ví dụ: text, watermark, blurry, deformed limbs, low quality, oversaturated..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 text-xs"
          />
        </div>

        <div className="space-y-2 flex flex-col justify-end">
          <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition">
            <input
              type="checkbox"
              checked={config.useImageSearch}
              onChange={(e) => onChangeConfig({ useImageSearch: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500 h-4 w-4"
            />
            <div className="flex-1">
              <span className="text-slate-200 font-medium flex items-center gap-1 text-xs">
                <Globe className="w-3 h-3 text-sky-400" />
                Google Image Search Grounding
              </span>
              <p className="text-[10px] text-slate-500">
                Cho phép Nano Banana 2.1 tìm kiếm hình ảnh web làm ngữ cảnh
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
