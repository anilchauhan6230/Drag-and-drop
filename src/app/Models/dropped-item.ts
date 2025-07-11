export interface DroppedItem {
  id: string;
  type: string;
  top: number;
  left: number;
  width: number;
  height: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  fromId?: string;
  toId?: string;
  fromAnchorIndex?: number;
  toAnchorIndex?: number;
  text?: string;
  editing?: boolean;
  isNew?: boolean;
  path?: string;
}
