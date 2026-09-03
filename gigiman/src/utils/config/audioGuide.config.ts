/**
 * Audio Guide Configuration
 * 
 * Centralised mapping of role × step → audio asset.
 * To add role-specific audio later, simply swap the require() for that role/step.
 */

import { UserRole } from '../enums/CommonEnum';

// ─── Asset type returned by require() for static files ───
type AudioAsset = number; // Metro bundler resolves require() to a number id

// ─── Per-step audio map ───
type StepAudioMap = Record<number, AudioAsset>;

// ─── Full role → step → asset map ───
type RoleAudioMap = Record<string, StepAudioMap>;

const audioMap: RoleAudioMap = {
  [UserRole.SINGLE_EMPLOYEE]: {
    0: require('../../../assets/sounds/Case0SingleEmp.mp3'),
    1: require('../../../assets/sounds/Case1SingleEmp.mp3'),
    2: require('../../../assets/sounds/Case2SingleEmp.mp3'),
    3: require('../../../assets/sounds/Case3SingleEmp.mp3'),
  },
  [UserRole.MULTI_EMPLOYEE]: {
    0: require('../../../assets/sounds/Case0SingleEmp.mp3'),
    1: require('../../../assets/sounds/Case1SingleEmp.mp3'),
    2: require('../../../assets/sounds/Case2SingleEmp.mp3'),
    3: require('../../../assets/sounds/Case3SingleEmp.mp3'),
  },
  [UserRole.TOOL_SHOP]: {
    0: require('../../../assets/sounds/Case0SingleEmp.mp3'),
    1: require('../../../assets/sounds/Case1SingleEmp.mp3'),
    2: require('../../../assets/sounds/Case2SingleEmp.mp3'),
    3: require('../../../assets/sounds/Case3SingleEmp.mp3'),
  },
};

/**
 * Get the audio asset for a given role and step.
 * Returns null if no audio is mapped for the combination.
 */
export const getAudioForStep = (
  role: string,
  step: number,
): AudioAsset | null => {
  return audioMap[role]?.[step] ?? null;
};

export default audioMap;
