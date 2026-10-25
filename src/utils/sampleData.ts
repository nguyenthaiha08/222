import { PromptFile } from '../types';

export const SAMPLE_PROMPT_FILES: PromptFile[] = [
  {
    id: 'sample-1',
    name: 'cyberpunk_saigon_2077.txt',
    content: 'A futuristic cybernetic street vendor in neon-lit night Saigon, pouring iced Vietnamese milk coffee into a glowing holographic glass, bustling rain-slicked alley with neon signs, flying vintage scooters overhead, cinematic 8k, hyper-detailed, octane render lighting.',
    lastModified: Date.now() - 3600000,
    splitByLine: false,
  },
  {
    id: 'sample-2',
    name: 'vietnamese_ha_long_mythology.txt',
    content: 'Majestic ancient jade dragon descending upon Ha Long Bay at dawn, emerald waters, mist floating between limestone karsts, traditional junk boats with crimson sails, sun rays piercing through clouds, ethereal Asian fantasy oil painting masterpiece.',
    lastModified: Date.now() - 2500000,
    splitByLine: false,
  },
  {
    id: 'sample-3',
    name: 'macro_bonsai_terrarium.txt',
    content: 'Macro photograph of a miniature Japanese bonsai tree encased inside a glowing teardrop glass terrarium, tiny moss waterfalls, dew drops catching golden morning sunlight, ultra sharp focus, depth of field 85mm f/1.4, photorealistic 4K.',
    lastModified: Date.now() - 1500000,
    splitByLine: false,
  },
  {
    id: 'sample-4',
    name: 'vintage_hoi_an_lanterns.txt',
    content: 'Charming ancient town of Hoi An at twilight, hundreds of colorful silk lanterns illuminating wooden yellow colonial shop houses, reflective river with lotus candle floating lanterns, nostalgic kodachrome 35mm film photography, romantic warm atmosphere.',
    lastModified: Date.now() - 600000,
    splitByLine: false,
  },
];
