export interface Drop {
  id: string;
  shapeType: string; // 'circle', 'square', 'line'
  description?: string; // 'circle', 'square', 'line'
  nextId?: string;
  top?: number;
  left?: number;
  width?: number;
  height?: number;
  text?: string;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  fromId?: number;
  toId?: number;
}
