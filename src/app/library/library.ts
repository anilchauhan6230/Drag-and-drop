import { AfterViewInit, Component } from '@angular/core';
import { jsPlumb } from 'jsplumb';
import interact from 'interactjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-library',
  imports: [CommonModule, FormsModule],
  templateUrl: './library.html',
  styleUrl: './library.scss',
})
export class Library implements AfterViewInit {
  jsPlumbInstance: any;
  shapes: { id: string; type: string }[] = [];

  ngAfterViewInit() {
    this.jsPlumbInstance = jsPlumb.getInstance();
    this.jsPlumbInstance.setContainer('canvas');
  }

  addShape(type: string) {
    const id = 'shape-' + Date.now();
    const offsetX = 100 + Math.random() * 300;
    const offsetY = 100 + Math.random() * 300;

    this.shapes.push({ id, type });

    setTimeout(() => {
      const el = document.getElementById(id)!;

      el.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      el.setAttribute('data-x', offsetX.toString());
      el.setAttribute('data-y', offsetY.toString());

      interact(el)
        .draggable({
          listeners: {
            move(event) {
              const target = event.target;
              const x =
                (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
              const y =
                (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
              target.style.transform = `translate(${x}px, ${y}px)`;
              target.setAttribute('data-x', x.toString());
              target.setAttribute('data-y', y.toString());
            },
          },
        })
        .resizable({
          edges: { left: true, right: true, bottom: true, top: true },
          listeners: {
            move(event) {
              const target = event.target;
              let x = parseFloat(target.getAttribute('data-x') || '0');
              let y = parseFloat(target.getAttribute('data-y') || '0');

              target.style.width = `${event.rect.width}px`;
              target.style.height = `${event.rect.height}px`;

              x += event.deltaRect.left;
              y += event.deltaRect.top;

              target.style.transform = `translate(${x}px, ${y}px)`;
              target.setAttribute('data-x', x.toString());
              target.setAttribute('data-y', y.toString());
            },
          },
        });

      this.jsPlumbInstance.draggable(el);

      this.jsPlumbInstance.makeSource(el, {
        anchor: 'Continuous',
        connector: ['Flowchart', { stub: 30, cornerRadius: 5 }],
        connectorStyle: { stroke: '#2c3e50', strokeWidth: 2 },
        maxConnections: 5,
        endpoint: 'Dot',
        paintStyle: { fill: '#2c3e50', radius: 5 },
      });

      this.jsPlumbInstance.makeTarget(el, {
        anchor: 'Continuous',
        allowLoopback: false,
      });
    });
  }

  removeShape(id: string) {
    this.shapes = this.shapes.filter((s) => s.id !== id);
    this.jsPlumbInstance.remove(id);
  }
}
