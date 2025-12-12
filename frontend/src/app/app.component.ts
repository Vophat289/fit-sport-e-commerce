import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ChatbotWidgetComponent } from './components/chatbot-widget/chatbot-widget.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true, 
  imports: [ 
    RouterOutlet, 
    CommonModule,
    ChatbotWidgetComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'frontend';
  showChatbot = true;

  constructor(private router: Router) {}

  ngOnInit() {
    // Lắng nghe sự kiện thay đổi route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        // Kiểm tra nếu URL bắt đầu bằng /admin thì ẩn chatbot
        this.showChatbot = !event.url.startsWith('/admin');
      });
  }
}
