import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chatbot-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chatbot-widget.component.html',
  styleUrl: './chatbot-widget.component.css'
})
export class ChatbotWidgetComponent {
  isOpen = false;

  toggleChatbot() {
    this.isOpen = !this.isOpen;
  }

  closeChatbot() {
    this.isOpen = false;
  }
}
