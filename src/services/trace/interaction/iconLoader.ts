/**
 * Icon loading utilities with caching.
 */

const iconCache = new Map<string, HTMLImageElement>();

export const loadIcon = async (iconPath: string): Promise<HTMLImageElement> => {
  const cached = iconCache.get(iconPath);
  if (cached) return cached;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      iconCache.set(iconPath, img);
      resolve(img);
    };
    img.onerror = () => {
      resolve(img);
    };
    img.src = iconPath;
  });
};

export const clearIconCache = (): void => {
  iconCache.clear();
};
