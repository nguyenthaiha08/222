import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '30mb' }));

/**
 * KeyManager handles multi-key pooling and automatic rotation
 * when an API key encounters quota exhaustion (429 or ResourceExhausted).
 * Keys can be supplied via GEMINI_API_KEY separated by commas, semicolons, or newlines.
 */
class KeyManager {
  private keys: string[] = [];
  private currentIndex: number = 0;
  private keyExhaustedUntil: Map<number, number> = new Map();

  constructor() {
    this.refreshKeys();
  }

  public refreshKeys() {
    const raw = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEYS || '';
    this.keys = raw
      .split(/[,;\n]+/)
      .map((k) => k.trim())
      .filter((k) => k.length > 5);
  }

  public getAvailableKeyCount(): number {
    this.refreshKeys();
    return this.keys.length;
  }

  public getMaskedKey(index: number): string {
    const key = this.keys[index];
    if (!key) return '';
    return key.length > 8 ? `${key.slice(0, 4)}...${key.slice(-4)}` : '****';
  }

  public getCurrentKeyInfo() {
    this.refreshKeys();
    return {
      totalKeys: this.keys.length,
      currentIndex: this.keys.length > 0 ? (this.currentIndex % this.keys.length) + 1 : 0,
      currentMasked: this.getMaskedKey(this.currentIndex % Math.max(1, this.keys.length)),
    };
  }

  public getKey(): { key: string; index: number } {
    this.refreshKeys();
    if (this.keys.length === 0) {
      throw new Error('Chưa cấu hình GEMINI_API_KEY trong Settings > Secrets');
    }

    const now = Date.now();
    // Try to find a key that is not in cooldown
    for (let attempts = 0; attempts < this.keys.length; attempts++) {
      const idx = (this.currentIndex + attempts) % this.keys.length;
      const exhaustedTime = this.keyExhaustedUntil.get(idx);
      if (!exhaustedTime || now > exhaustedTime) {
        this.currentIndex = idx;
        return { key: this.keys[idx], index: idx };
      }
    }

    // If all keys are currently marked as exhausted, pick the next one anyway
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    return { key: this.keys[this.currentIndex], index: this.currentIndex };
  }

  public markKeyExhausted(index: number, cooldownMs = 60000) {
    this.keyExhaustedUntil.set(index, Date.now() + cooldownMs);
    console.log(
      `[KeyManager] Key #${index + 1} (${this.getMaskedKey(index)}) marked exhausted for ${
        cooldownMs / 1000
      }s`
    );
    // Rotate to next key
    if (this.keys.length > 1) {
      this.currentIndex = (index + 1) % this.keys.length;
    }
  }

  public setKeys(newKeys: string[]) {
    const valid = newKeys
      .map((k) => k.trim())
      .filter((k) => k.length > 5);
    // Unique keys
    this.keys = Array.from(new Set(valid));
    this.currentIndex = 0;
    this.keyExhaustedUntil.clear();
    console.log(`[KeyManager] Key pool updated with ${this.keys.length} active keys.`);
  }

  public getAllMaskedKeys(): string[] {
    return this.keys.map((_, i) => this.getMaskedKey(i));
  }

  public getAllKeys(): string[] {
    return [...this.keys];
  }

  public createClient(key: string): GoogleGenAI {
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
}

const keyManager = new KeyManager();

// API Keys Management Endpoints
app.get('/api/keys', (_req: Request, res: Response) => {
  const keyInfo = keyManager.getCurrentKeyInfo();
  res.json({
    totalKeys: keyInfo.totalKeys,
    currentIndex: keyInfo.currentIndex,
    maskedKeys: keyManager.getAllMaskedKeys(),
  });
});

app.post('/api/keys', (req: Request, res: Response) => {
  const { keys } = req.body;
  if (Array.isArray(keys)) {
    keyManager.setKeys(keys);
  }
  const keyInfo = keyManager.getCurrentKeyInfo();
  res.json({
    success: true,
    totalKeys: keyInfo.totalKeys,
    currentIndex: keyInfo.currentIndex,
    maskedKeys: keyManager.getAllMaskedKeys(),
  });
});

// Health/Status check with Key Pool details
app.get('/api/status', (_req: Request, res: Response) => {
  const keyInfo = keyManager.getCurrentKeyInfo();
  res.json({
    status: 'ok',
    hasApiKey: keyInfo.totalKeys > 0,
    keyPool: {
      totalKeys: keyInfo.totalKeys,
      currentIndex: keyInfo.currentIndex,
      currentMasked: keyInfo.currentMasked,
      maskedKeys: keyManager.getAllMaskedKeys(),
      autoRotate: true,
    },
    defaultModel: 'gemini-nano-banana-2.1',
    supportedModels: [
      { id: 'gemini-nano-banana-2.1', name: 'Google Nano Banana 2.1 (Được yêu cầu - Hỗ trợ 1K/2K/4K)', recommended: true },
      { id: 'gemini-3.1-flash-lite-image', name: 'Google Nano Banana Lite (Fast)', recommended: false },
      { id: 'gemini-3-pro-image', name: 'Google Nano Banana Pro', recommended: false },
    ],
  });
});

// Image Generation Endpoint with Automatic Key Failover
app.post('/api/generate-image', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      model = 'gemini-nano-banana-2.1',
      aspectRatio = '1:1',
      imageSize = '1K',
      stylePreset,
      negativePrompt,
      useImageSearch = false,
    } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt không được để trống' });
    }

    const totalAvailableKeys = keyManager.getAvailableKeyCount();
    if (totalAvailableKeys === 0) {
      return res.status(500).json({
        error: 'NO_API_KEY',
        message: 'Chưa cấu hình GEMINI_API_KEY trong hệ thống. Vui lòng thêm trong Settings > Secrets.',
      });
    }

    // Construct enriched prompt with style tags if selected
    let effectivePrompt = prompt.trim();
    if (stylePreset && stylePreset !== 'none') {
      const styles: Record<string, string> = {
        cinematic: 'cinematic lighting, 8k resolution, dramatic angle, highly detailed, photorealistic',
        photorealistic: 'ultra-realistic photograph, 85mm lens, f/1.8, natural soft lighting, hyper-detailed',
        anime: 'vibrant anime aesthetic, Studio Ghibli inspired, high quality digital illustration, clean linework',
        digital_art: 'masterpiece digital art, trending on ArtStation, vivid colors, intricate composition',
        cyberpunk: 'cyberpunk neon lighting, futuristic sci-fi city atmosphere, volumetric smoke, high contrast',
        watercolor: 'traditional soft watercolor painting, bleeding edges, paper texture, artistic wash',
        '3d_render': 'octane render 3D, Blender cycle, hyperrealistic materials, subsurface scattering',
        vintage: 'vintage 35mm film photograph, subtle grain, warm nostalgic color grading, Kodachrome feel',
      };
      const addition = styles[stylePreset] || stylePreset;
      effectivePrompt = `${effectivePrompt}, ${addition}`;
    }

    if (negativePrompt && negativePrompt.trim()) {
      effectivePrompt = `${effectivePrompt} (avoiding: ${negativePrompt.trim()})`;
    }

    const allowedModels = [
      'gemini-nano-banana-2.1',
      'gemini-3.1-flash-lite-image',
      'gemini-3-pro-image',
    ];
    const targetModel = allowedModels.includes(model) ? model : 'gemini-nano-banana-2.1';

    // Model configuration
    const config: any = {};
    if (targetModel === 'gemini-nano-banana-2.1' || targetModel === 'gemini-3-pro-image') {
      config.imageConfig = {
        aspectRatio: aspectRatio || '1:1',
        imageSize: imageSize || '1K',
      };

      if (useImageSearch && targetModel === 'gemini-nano-banana-2.1') {
        config.tools = [
          {
            googleSearch: {
              searchTypes: {
                webSearch: {},
                imageSearch: {},
              },
            },
          },
        ];
      }
    } else if (targetModel === 'gemini-3.1-flash-lite-image') {
      config.imageConfig = {
        aspectRatio: aspectRatio || '1:1',
      };
    }

    console.log(`[Generate] Model: ${targetModel}, Aspect: ${aspectRatio}, Size: ${imageSize}`);
    console.log(`[Generate] Prompt: ${effectivePrompt.slice(0, 100)}...`);

    // Automatic Key Rotation Loop
    let attempts = 0;
    const maxAttempts = Math.max(1, totalAvailableKeys);
    let lastError: any = null;
    let successfulResult: any = null;

    while (attempts < maxAttempts) {
      const { key, index: keyIndex } = keyManager.getKey();
      const ai = keyManager.createClient(key);
      const masked = keyManager.getMaskedKey(keyIndex);

      console.log(`[Generate] Attempting with Key #${keyIndex + 1}/${totalAvailableKeys} (${masked})...`);

      try {
        const response = await ai.models.generateContent({
          model: targetModel,
          contents: {
            parts: [{ text: effectivePrompt }],
          },
          config: Object.keys(config).length > 0 ? config : undefined,
        });

        let imageUrl: string | null = null;
        let mimeType = 'image/png';
        let textSummary = '';

        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            mimeType = part.inlineData.mimeType || 'image/png';
            imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
            break;
          } else if (part.text) {
            textSummary += part.text + ' ';
          }
        }

        if (!imageUrl) {
          throw new Error(textSummary.trim() || 'Model không trả về dữ liệu ảnh. Vui lòng kiểm tra lại prompt.');
        }

        successfulResult = {
          success: true,
          imageUrl,
          mimeType,
          modelUsed: targetModel,
          aspectRatio,
          imageSize,
          prompt: prompt.trim(),
          effectivePrompt,
          textSummary: textSummary.trim(),
          timestamp: Date.now(),
          keyUsed: {
            index: keyIndex + 1,
            totalKeys: totalAvailableKeys,
            masked,
            rotated: attempts > 0,
          },
        };
        break; // Successfully generated image!
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || '';
        const isQuotaOrLimit =
          errMsg.includes('quota') ||
          errMsg.includes('ResourceExhausted') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('429') ||
          errMsg.includes('403') ||
          errMsg.includes('PERMISSION_DENIED');

        console.warn(`[Generate] Key #${keyIndex + 1} failed: ${errMsg}`);

        if (isQuotaOrLimit && totalAvailableKeys > 1) {
          keyManager.markKeyExhausted(keyIndex, 60000); // 1 minute cooldown
          attempts++;
          console.log(`[Generate] Quota/Permission issue on Key #${keyIndex + 1}. Auto-switching to next key (${attempts}/${maxAttempts})...`);
          continue;
        } else {
          // Break if only 1 key or non-retriable prompt validation error
          break;
        }
      }
    }

    if (successfulResult) {
      return res.json(successfulResult);
    }

    // If all attempts failed
    console.error('All key attempts exhausted or error occurred:', lastError);
    let finalMessage = lastError?.message || 'Lỗi không xác định khi tạo ảnh';
    if (finalMessage.includes('quota') || finalMessage.includes('ResourceExhausted') || finalMessage.includes('429')) {
      finalMessage = `Đã vượt hạn mức quota trên tất cả ${totalAvailableKeys} API key trong pool. Vui lòng chờ ít phút hoặc thêm key khác.`;
    } else if (finalMessage.includes('PERMISSION_DENIED') || finalMessage.includes('403')) {
      finalMessage = 'Lỗi 403 (Permission Denied): Model Nano Banana 2.1 yêu cầu API Key có bật thanh toán (Paid API Key / Pay-as-you-go trên Google AI Studio). Tài khoản Free Tier không được phép gọi mô hình tạo ảnh này.';
    }

    res.status(500).json({
      error: 'GENERATION_FAILED',
      message: finalMessage,
      keysAttempted: attempts + 1,
      totalKeys: totalAvailableKeys,
    });
  } catch (err: any) {
    console.error('Error generating image:', err);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: err?.message || 'Lỗi xử lý yêu cầu tạo ảnh',
    });
  }
});

// Prompt Optimizer / Enhancer endpoint using gemini-3.8-flash with KeyManager
app.post('/api/enhance-prompt', async (req: Request, res: Response) => {
  try {
    const { prompt, style } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const { key } = keyManager.getKey();
    const ai = keyManager.createClient(key);

    const systemPrompt = `You are an expert AI prompt engineer specializing in high-fidelity image generation with Google Nano Banana 2.1 and Imagen models.
Given the user's prompt in Vietnamese or English, generate an enhanced, descriptive, and vivid English image prompt optimized for text-to-image models.
Keep the original subject, mood, and core intent, but enrich with:
- Visual details, textures, materials
- Lighting (e.g. volumetric, rim light, golden hour, neon)
- Atmosphere, depth of field, camera framing
Output ONLY the enhanced prompt string. Do not include markdown headers, quotes, or explanations.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Original prompt: "${prompt}". Preferred style hint: ${style || 'cinematic and detailed'}.`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    const enhanced = response.text?.trim() || prompt;
    res.json({ enhancedPrompt: enhanced });
  } catch (err: any) {
    console.error('Error enhancing prompt:', err);
    res.status(500).json({ error: err?.message || 'Failed to enhance prompt' });
  }
});

// Start dev or production server
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
