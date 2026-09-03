import { Dimensions, PixelRatio } from 'react-native';

// Base design width (use your Figma design width, e.g., 375)
const BASE_WIDTH = 375;

/**
 * Scales font size relative to device width & respects user font settings.
 * @param size - font size from design
 * @returns scaled font size
 */
export const scaleFont = (size: number): number => {
  const { width } = Dimensions.get('window');
  const scale = width / BASE_WIDTH;
  const fontScale = PixelRatio.getFontScale();
  const newSize = size * scale * fontScale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};
