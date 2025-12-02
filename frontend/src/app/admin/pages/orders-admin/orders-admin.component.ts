import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-orders-admin',
  standalone: true,
  templateUrl: './orders-admin.component.html',
  styleUrls: ['./orders-admin.component.css'],
  imports: [CommonModule, FormsModule]
})
export class OrdersAdminComponent {
  searchText: string = '';

  orders = [
    { id: 'DH001', customer: 'Nguyễn Văn A', total: 1500000, status: 'Đang giao', date: '2025-11-20' },
    { id: 'DH002', customer: 'Trần Minh B', total: 890000, status: 'Hoàn thành', date: '2025-11-21' },
    { id: 'DH003', customer: 'Lê Hoàng C', total: 1290000, status: 'Chờ xác nhận', date: '2025-11-22' }
  ];

  get filteredOrders() {
    const search = this.searchText.toLowerCase();
    return this.orders.filter(order =>
      order.id.toLowerCase().includes(search) ||
      order.customer.toLowerCase().includes(search)
    );
  }
}
