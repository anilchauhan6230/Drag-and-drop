import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DroppedItem } from '../Models/dropped-item';
import { FormsModule } from '@angular/forms';
import { Drop } from '../Models/drop';

@Component({
  selector: 'app-drag-and-drop',
  imports: [CommonModule, FormsModule],
  templateUrl: './drag-and-drop.html',
  styleUrl: './drag-and-drop.scss',
})
export class DragAndDrop {
  draggedShape: string = '';
  draggedItemIndex: number | null = null;
  isDraggingExisting = false;
  selectedIndex: number | null = null;
  droppedItems: DroppedItem[] = [];
  shapes: string[] = [
    'square',
    'rectangle',
    'circle',
    'elbow-arrow',
    'arc',
    'line',
  ];
  handles: string[] = [
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
    'top',
    'bottom',
    'left',
    'right',
  ];

  dropItems: Drop[] = [
    {
      id: '1',
      description: 'circle',
      nextId: '2',
      shapeType: 'circle',
      text: 'Start',
    },
    {
      id: '2',
      description: 'square',
      nextId: '3',
      shapeType: 'square',
      text: 'Middle',
    },
    {
      id: '3',
      description: 'circle',
      nextId: '4',
      shapeType: 'circle',
      text: 'End',
    },
  ];

  ngOnInit() {
    this.convertToGraph(this.dropItems);
  }

  convertToGraph(items: Drop[]) {
    const shapeWidth = 100;
    const shapeHeight = 60;
    const gap = 150;

    const shapeMap: { [key: string]: DroppedItem } = {};

    items.forEach((item, index) => {
      const top = 100;
      const left = 100 + index * gap;

      const shape: DroppedItem = {
        id: item.id,
        type: item.shapeType,
        top,
        left,
        width: shapeWidth,
        height: shapeHeight,
        text: item.text,
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
      };

      this.droppedItems.push(shape);
      shapeMap[item.id] = shape;
    });

    items.forEach((item) => {
      if (item.nextId) {
        const from = shapeMap[item.id];
        const to = shapeMap[item.nextId];

        if (from && to) {
          const line: DroppedItem = {
            id: crypto.randomUUID(),
            type: 'line',
            fromId: from.id,
            toId: to.id,
            startX: from.left! + shapeWidth / 2,
            startY: from.top!,
            endX: to.left! + shapeWidth / 2,
            endY: to.top!,
            text: item.text,
            top: 0,
            left: 0,
            width: 0,
            height: 0,
          };
          this.droppedItems.push(line);
        }
      }
    });

    console.log(this.droppedItems);
  }

  svgShapes: string[] = ['line', 'elbow-arrow', 'arc'];

  defaultSizes: Record<string, { width: number; height: number }> = {
    square: { width: 100, height: 100 },
    rectangle: { width: 150, height: 100 },
    circle: { width: 100, height: 100 },
    line: { width: 100, height: 3 },
  };

  resizingIndex: number | null = null;
  startX: number = 0;
  startY: number = 0;
  startWidth: number = 0;
  startHeight: number = 0;
  startTop: number = 0;
  startLeft: number = 0;
  resizeDirection: string = '';
  startLineStartX: number = 0;
  startLineStartY: number = 0;
  startLineEndX: number = 0;
  startLineEndY: number = 0;
  isDragging = false;
  isDraggingOverCanvas: boolean = false;
  editingLineIndex: number | null = null;

  onDragStart(shapeType: string) {
    this.draggedShape = shapeType;
    this.isDraggingExisting = false;
  }
  onDragEnd(shapeType: string) {
    this.isDraggingExisting = true;
  }

  onShapeDragStart(index: number) {
    this.draggedItemIndex = index;
    this.isDraggingExisting = true;
    this.draggedShape = this.droppedItems[index].type;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDraggingOverCanvas = true;
  }

  onDrop(event: DragEvent) {
    console.log(event);
    this.isDraggingOverCanvas = false;
    const canvas = (event.target as HTMLElement).closest('.canvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const id = crypto.randomUUID();

    if (this.isDraggingExisting && this.draggedItemIndex !== null) {
      const movedItem = this.droppedItems[this.draggedItemIndex];
      const prevX = movedItem.left ?? movedItem.startX ?? 0;
      const prevY = movedItem.top ?? movedItem.startY ?? 0;

      const dx = x - prevX;
      const dy = y - prevY;

      movedItem.left = x;
      movedItem.top = y;

      if (['line', 'elbow-arrow', 'arc'].includes(movedItem.type)) {
        movedItem.startX! += dx;
        movedItem.startY! += dy;
        movedItem.endX! += dx;
        movedItem.endY! += dy;

        if (movedItem.type === 'elbow-arrow') {
          movedItem.path = this.getElbowArrowPath(
            movedItem.startX!,
            movedItem.startY!,
            movedItem.endX!,
            movedItem.endY!
          );
        } else if (movedItem.type === 'arc') {
          movedItem.path = this.getArcPath(
            movedItem.startX!,
            movedItem.startY!,
            movedItem.endX!,
            movedItem.endY!
          );
        }
      }

      for (const item of this.droppedItems) {
        const connected =
          item.fromId === movedItem.id || item.toId === movedItem.id;

        if (connected && this.svgShapes.includes(item.type)) {
          const coords = this.getLineCoordinates(item);

          item.startX = coords.x1;
          item.startY = coords.y1;
          item.endX = coords.x2;
          item.endY = coords.y2;

          if (item.type === 'elbow-arrow') {
            item.path = this.getElbowArrowPath(
              coords.x1,
              coords.y1,
              coords.x2,
              coords.y2
            );
          } else if (item.type === 'arc') {
            item.path = this.getArcPath(
              coords.x1,
              coords.y1,
              coords.x2,
              coords.y2
            );
          }
        }
      }

      this.droppedItems = [...this.droppedItems];
      this.droppedItems = [...this.droppedItems];
      this.droppedItems = [...this.droppedItems];
    } else {
      if (this.draggedShape === 'line') {
        const newLine: DroppedItem = {
          id,
          type: 'line',
          left: x,
          top: y,
          width: 100,
          height: 5,
          startX: x,
          startY: y,
          endX: x + 100,
          endY: y,
        };

        const SNAP_DISTANCE = 7;

        for (const shape of this.droppedItems.filter(
          (s) => s.type !== 'line'
        )) {
          const anchors = this.getAllAnchorPoints(shape);

          for (const anchor of anchors) {
            const d1 = Math.hypot(
              newLine.startX! - anchor.x,
              newLine.startY! - anchor.y
            );
            if (d1 < SNAP_DISTANCE) {
              newLine.fromId = shape.id;
              newLine.startX = anchor.x;
              newLine.startY = anchor.y;
              break;
            }
          }

          for (const anchor of anchors) {
            const d2 = Math.hypot(
              newLine.endX! - anchor.x,
              newLine.endY! - anchor.y
            );
            if (d2 < SNAP_DISTANCE) {
              newLine.toId = shape.id;
              newLine.endX = anchor.x;
              newLine.endY = anchor.y;
              break;
            }
          }
        }

        this.droppedItems.push(newLine);
      } else if (this.draggedShape === 'elbow-arrow') {
        const newElbowArrow: DroppedItem = {
          id,
          type: 'elbow-arrow',
          left: x,
          top: y,
          startX: x,
          startY: y,
          endX: x + 100,
          endY: y + 100,
          width: 100,
          height: 100,
          path: this.getElbowArrowPath(x, y, x + 100, y + 100),
        };

        this.droppedItems.push(newElbowArrow);
      } else if (this.draggedShape === 'arc') {
        const newArc: DroppedItem = {
          id,
          type: 'arc',
          left: x,
          top: y,
          startX: x,
          startY: y,
          endX: x + 100,
          endY: y + 100,
          width: 100,
          height: 100,
          path: this.getArcPath(x, y, x + 100, y + 100),
        };

        this.droppedItems.push(newArc);
      } else {
        this.droppedItems.push({
          id,
          type: this.draggedShape,
          left: x,
          top: y,
          ...this.defaultSizes[this.draggedShape],
          startX: 0,
          startY: 0,
          endX: 0,
          endY: 0,
          isNew: true,
        });
      }
    }

    this.draggedItemIndex = null;
    this.isDraggingExisting = false;

    setTimeout(() => {
      const dropped = this.droppedItems.find((i) => i.id === id);
      if (dropped) dropped.isNew = false;
    }, 500);
  }

  startResize(event: MouseEvent, index: number, direction: string) {
    event.stopPropagation();
    event.preventDefault();

    this.resizingIndex = index;
    this.resizeDirection = direction;
    this.startX = event.clientX;
    this.startY = event.clientY;

    const shape = this.droppedItems[index];
    this.startWidth = shape.width;
    this.startHeight = shape.height;
    this.startTop = shape.top;
    this.startLeft = shape.left;

    if (this.svgShapes.includes(shape.type)) {
      this.startLineStartX = shape.startX!;
      this.startLineStartY = shape.startY!;
      this.startLineEndX = shape.endX!;
      this.startLineEndY = shape.endY!;
    }

    document.addEventListener('mousemove', this.onResizing);
    document.addEventListener('mouseup', this.stopResize);
  }

  onResizing = (event: MouseEvent) => {
    if (this.resizingIndex === null || !this.resizeDirection) return;

    const item = this.droppedItems[this.resizingIndex];
    item.isNew = false;

    if (this.svgShapes.includes(item.type)) {
      const dx = event.clientX - this.startX;
      const dy = event.clientY - this.startY;

      if (this.resizeDirection === 'right') {
        item.endX = this.startLineEndX + dx;
        item.endY = this.startLineEndY + dy;
        this.trySnap(item, 'end');
      }

      if (this.resizeDirection === 'left') {
        item.startX = this.startLineStartX + dx;
        item.startY = this.startLineStartY + dy;
        this.trySnap(item, 'start');
      }

      if (item.type === 'elbow-arrow') {
        item.path = this.getElbowArrowPath(
          item.startX!,
          item.startY!,
          item.endX!,
          item.endY!
        );
      } else if (item.type === 'arc') {
        item.path = this.getArcPath(
          item.startX!,
          item.startY!,
          item.endX!,
          item.endY!
        );
      }

      this.droppedItems = [...this.droppedItems]; // trigger update
      return;
    }

    if (
      item.type == 'square' ||
      item.type == 'rectangle' ||
      item.type == 'circle'
    ) {
      const dx = event.clientX - this.startX;
      const dy = event.clientY - this.startY;

      const item = this.droppedItems[this.resizingIndex];
      const updated = { ...item };

      switch (this.resizeDirection) {
        case 'right':
          updated.width = Math.max(20, this.startWidth + dx);
          break;
        case 'left':
          updated.width = Math.max(20, this.startWidth - dx);
          updated.left = this.startLeft + dx;
          break;
        case 'bottom':
          updated.height = Math.max(20, this.startHeight + dy);
          break;
        case 'top':
          updated.height = Math.max(20, this.startHeight - dy);
          updated.top = this.startTop + dy;
          break;
        case 'top-left':
          updated.width = Math.max(20, this.startWidth - dx);
          updated.left = this.startLeft + dx;
          updated.height = Math.max(20, this.startHeight - dy);
          updated.top = this.startTop + dy;
          break;
        case 'top-right':
          updated.width = Math.max(20, this.startWidth + dx);
          updated.height = Math.max(20, this.startHeight - dy);
          updated.top = this.startTop + dy;
          break;
        case 'bottom-left':
          updated.width = Math.max(20, this.startWidth - dx);
          updated.left = this.startLeft + dx;
          updated.height = Math.max(20, this.startHeight + dy);
          break;
        case 'bottom-right':
          updated.width = Math.max(20, this.startWidth + dx);
          updated.height = Math.max(20, this.startHeight + dy);
          break;
      }

      this.droppedItems[this.resizingIndex] = updated;
    }

    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;
    const SNAP_DISTANCE = 20;

    if (this.resizeDirection === 'right') {
      item.endX = this.startLineEndX + dx;
      item.endY = this.startLineEndY + dy;

      let snapped = false;
      for (const shape of this.droppedItems.filter((s) => s.type !== 'line')) {
        const anchors = this.getAllAnchorPoints(shape);
        for (let i = 0; i < anchors.length; i++) {
          const anchor = anchors[i];
          const dist = Math.hypot(item.endX - anchor.x, item.endY - anchor.y);
          if (dist < SNAP_DISTANCE) {
            item.endX = anchor.x;
            item.endY = anchor.y;
            item.toId = shape.id;
            item.toAnchorIndex = i; // ⬅️ Save the anchor index
            snapped = true;
            break;
          }
        }
        if (snapped) break;
      }

      if (!snapped) {
        item.toId = undefined;
        item.toAnchorIndex = undefined;
      }
    }

    if (this.resizeDirection === 'left') {
      item.startX = this.startLineStartX + dx;
      item.startY = this.startLineStartY + dy;

      let snapped = false;
      for (const shape of this.droppedItems.filter((s) => s.type !== 'line')) {
        const anchors = this.getAllAnchorPoints(shape);
        for (let i = 0; i < anchors.length; i++) {
          const anchor = anchors[i];
          const dist = Math.hypot(
            item.startX - anchor.x,
            item.startY - anchor.y
          );
          if (dist < SNAP_DISTANCE) {
            item.startX = anchor.x;
            item.startY = anchor.y;
            item.fromId = shape.id;
            item.fromAnchorIndex = i;
            snapped = true;
            break;
          }
        }
        if (snapped) break;
      }

      if (!snapped) {
        item.fromId = undefined;
        item.fromAnchorIndex = undefined;
      }
    }

    this.droppedItems = [...this.droppedItems];
  };

  stopResize = () => {
    document.removeEventListener('mousemove', this.onResizing);
    document.removeEventListener('mouseup', this.stopResize);
    this.resizingIndex = null;
  };

  onShapeClick(index: number, event: MouseEvent) {
    event.stopPropagation();
    this.selectedIndex = index;
  }

  deselectShape() {
    this.selectedIndex = null;
  }

  getLineCoordinates(line: DroppedItem) {
    let x1 = line.startX ?? line.left;
    let y1 = line.startY ?? line.top;
    let x2 = line.endX ?? line.left + (line.width ?? 100);
    let y2 = line.endY ?? line.top + (line.height ?? 5);

    const OFFSET = 10;

    if (line.fromId) {
      const from = this.droppedItems.find((i) => i.id === line.fromId);
      if (from) {
        const anchors = this.getAllAnchorPoints(from);
        const index = line.fromAnchorIndex ?? 0;
        if (anchors[index]) {
          const anchor = anchors[index];
          const angle = Math.atan2(y2 - anchor.y, x2 - anchor.x);
          x1 = anchor.x + OFFSET * Math.cos(angle);
          y1 = anchor.y + OFFSET * Math.sin(angle);
        }
      }
    }

    if (line.toId) {
      const to = this.droppedItems.find((i) => i.id === line.toId);
      if (to) {
        const anchors = this.getAllAnchorPoints(to);
        const index = line.toAnchorIndex ?? 0;
        if (anchors[index]) {
          const anchor = anchors[index];
          const angle = Math.atan2(y1 - anchor.y, x1 - anchor.x);
          x2 = anchor.x + OFFSET * Math.cos(angle);
          y2 = anchor.y + OFFSET * Math.sin(angle);
        }
      }
    }

    return { x1, y1, x2, y2 };
  }

  getAllAnchorPoints(shape: DroppedItem) {
    const { left, top, width, height } = shape;
    const offset = 10;

    const cx = left + width / 2;
    const cy = top + height / 2;

    return [
      { x: cx + offset, y: top }, // Top (above center)
      {
        x: cx + offset,
        y: top + height + 2 * offset,
      }, // Bottom
      { x: left - offset, y: cy + offset }, // Left
      { x: left + width + 2 * offset, y: cy + 1 * offset }, // Right

      { x: left + offset / 2, y: top + offset / 2 }, // Top-left
      { x: left + width + 3 * offset, y: top + offset }, // Top-right
      { x: left, y: top + height + 2 * offset }, // Bottom-left
      { x: left + width + 2 * offset, y: top + height + offset }, // Bottom-right
    ];
  }

  onLabelBlur(event: any, line: DroppedItem) {
    line.text = event.target.textContent.trim();
  }

  getLinePath(line: DroppedItem): string {
    const { x1, y1, x2, y2 } = this.getLineCoordinates(line);
    const radius = 10;
    const path: string[] = [];

    path.push(`M${x1},${y1}`);

    const dx = x2 - x1;
    const dy = y2 - y1;
    const horizontal = Math.abs(dx) > Math.abs(dy);

    if (x1 === x2 || y1 === y2) {
      // Straight line
      path.push(`L${x2},${y2}`);
    } else if (horizontal) {
      // Horizontal elbow
      const midX = x1 + dx / 2;
      const signDx = Math.sign(dx);
      const signDy = Math.sign(dy);

      path.push(`L${midX - signDx * radius},${y1}`);
      path.push(`Q${midX},${y1} ${midX},${y1 + signDy * radius}`);
      path.push(`L${midX},${y2 - signDy * radius}`);
      path.push(`Q${midX},${y2} ${midX + signDx * radius},${y2}`);
      path.push(`L${x2},${y2}`);
    } else {
      // Vertical elbow
      const midY = y1 + dy / 2;
      const signDx = Math.sign(dx);
      const signDy = Math.sign(dy);

      path.push(`L${x1},${midY - signDy * radius}`);
      path.push(`Q${x1},${midY} ${x1 + signDx * radius},${midY}`);
      path.push(`L${x2 - signDx * radius},${midY}`);
      path.push(`Q${x2},${midY} ${x2},${midY + signDy * radius}`);
      path.push(`L${x2},${y2}`);
    }

    return path.join(' ');
  }

  getLineOverlayStyle(item: DroppedItem) {
    const { x1, y1, x2, y2 } = this.getLineCoordinates(item);

    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);

    return { left, top, width, height };
  }

  getElbowArrowPath(x1: number, y1: number, x2: number, y2: number): string {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    if (dx >= dy) {
      const midX = (x1 + x2) / 2;
      return `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`;
    } else {
      const midY = (y1 + y2) / 2;
      return `M ${x1} ${y1} V ${midY} H ${x2} V ${y2}`;
    }
  }

  getArcPath(x1: number, y1: number, x2: number, y2: number): string {
    const rx = Math.abs(x2 - x1) / 2;
    const ry = Math.abs(y2 - y1) / 2;
    return `M ${x1} ${y1} A ${rx} ${ry} 0 0 1 ${x2} ${y2}`;
  }

  deleteShape(index: number, event: MouseEvent): void {
    event.stopPropagation();
    this.droppedItems.splice(index, 1);
    this.selectedIndex = null;
  }

  trySnap(item: DroppedItem, point: 'start' | 'end') {
    const SNAP_DISTANCE = 20;
    const px = point === 'start' ? item.startX : item.endX;
    const py = point === 'start' ? item.startY : item.endY;

    for (const shape of this.droppedItems.filter((s) => s.type !== item.type)) {
      const anchors = this.getAllAnchorPoints(shape);
      for (let i = 0; i < anchors.length; i++) {
        const anchor = anchors[i];
        const dist = Math.hypot(px! - anchor.x, py! - anchor.y);
        if (dist < SNAP_DISTANCE) {
          if (point === 'start') {
            item.startX = anchor.x;
            item.startY = anchor.y;
            item.fromId = shape.id;
            item.fromAnchorIndex = i;
          } else {
            item.endX = anchor.x;
            item.endY = anchor.y;
            item.toId = shape.id;
            item.toAnchorIndex = i;
          }
          return;
        }
      }
    }

    if (point === 'start') {
      item.fromId = undefined;
      item.fromAnchorIndex = undefined;
    } else {
      item.toId = undefined;
      item.toAnchorIndex = undefined;
    }
  }

  getLineMidPoint(item: DroppedItem) {
    const { x1, y1, x2, y2 } = this.getLineCoordinates(item);
    return {
      x: (x1 + x2) / 2,
      y: (y1 + y2) / 2,
    };
  }
}
