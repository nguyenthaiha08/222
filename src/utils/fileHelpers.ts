import JSZip from 'jszip';
import { PromptFile, PromptTask } from '../types';

export function downloadTextFile(fileName: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.txt') ? fileName : `${fileName}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function downloadAllImagesZip(tasks: PromptTask[], zipName = 'nanoflow-generated-images.zip') {
  const completedTasks = tasks.filter((t) => t.status === 'completed' && t.imageUrl);
  if (completedTasks.length === 0) return;

  const zip = new JSZip();
  const folder = zip.folder('generated_images') || zip;

  for (let i = 0; i < completedTasks.length; i++) {
    const task = completedTasks[i];
    if (!task.imageUrl) continue;

    // Extract base64 data
    const parts = task.imageUrl.split(',');
    if (parts.length === 2) {
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/png';
      const ext = mime.includes('jpeg') ? 'jpg' : 'png';
      const base64Data = parts[1];

      // Clean filename
      const baseName = task.fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${String(i + 1).padStart(2, '0')}_${baseName}_${task.id.slice(0, 4)}.${ext}`;

      folder.file(filename, base64Data, { base64: true });
      // Also save the prompt as a companion text file
      folder.file(`${filename}.prompt.txt`, task.prompt);
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadAllPromptFilesZip(files: PromptFile[], zipName = 'prompt_files.zip') {
  if (files.length === 0) return;
  const zip = new JSZip();

  files.forEach((file) => {
    const name = file.name.endsWith('.txt') ? file.name : `${file.name}.txt`;
    zip.file(name, file.content);
  });

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
