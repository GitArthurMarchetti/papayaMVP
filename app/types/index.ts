export type CutType = 'Die Cut' | 'Kiss Cut';
export type ShapeType = 'Contour' | 'Circle' | 'Square';
export type MaterialType = 'Vinyl' | 'Holographic' | 'Transparent';
export type FinishType = 'Glossy' | 'Matte';

export type DesignConfig = {
  cutType: CutType;
  shape: ShapeType;
  outerGap: number;
  innerGap: number;
  material: MaterialType;
  finish: FinishType;
  quantity: number;
  width: number; 
  height: number; 
};

export type Design = {
  id: string;
  name: string;
  src: string;
  config: DesignConfig;
};