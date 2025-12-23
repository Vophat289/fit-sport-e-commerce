import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as AOS from 'aos';

@Component({
  selector: 'app-gioi-thieu',
  imports: [CommonModule],
  templateUrl: './gioi-thieu.component.html',
  styleUrl: './gioi-thieu.component.css'
})
export class GioiThieuComponent implements OnInit, AfterViewInit, OnDestroy {
  ngOnInit(): void {
    // Khởi tạo AOS
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out',
      once: true,
      mirror: false,
      offset: 100,
      disable: false
    });
  }

  ngAfterViewInit(): void {
    // Refresh AOS sau khi view được render
    setTimeout(() => {
      AOS.refresh();
    }, 100);
  }

  ngOnDestroy(): void {
    // Cleanup AOS
    AOS.refresh();
  }
}
