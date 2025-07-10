import { Component } from '@angular/core';
import { DragAndDrop } from './drag-and-drop/drag-and-drop';

@Component({
  selector: 'app-root',
  imports: [DragAndDrop],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
