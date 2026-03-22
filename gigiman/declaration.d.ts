
declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

declare module '*.wav' {
  const value: number;
  export default value;
}

declare module '*.mp3' {
  const value: number;
  export default value;
}
