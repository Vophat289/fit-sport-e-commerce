import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterOutlet } from '@angular/router'; 
import { HeaderComponent } from '../header/header.component'; 
import { FooterComponent } from '../footer/footer.component'; 

@Component({
  selector: 'app-client-layout',
  standalone: true, 
  imports: [
    CommonModule, 
    RouterOutlet, 
    FooterComponent,
    HeaderComponent
  ],
  templateUrl: './client-layout.component.html',
  styleUrls: ['./client-layout.component.css']
})
export class ClientLayoutComponent {
}