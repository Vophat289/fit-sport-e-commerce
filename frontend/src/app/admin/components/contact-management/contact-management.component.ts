import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { DatePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Contact {
  _id: string;
  fullName: string;
  email: string;
  content: string;
  phone: string;
  createdAt: string;
}

@Component({
  selector: 'app-contact-management',
  standalone: true,
  templateUrl: './contact-management.component.html',
  styleUrls: ['./contact-management.component.css'],
  imports: [CommonModule, FormsModule, HttpClientModule],
  providers: [DatePipe]
})
export class ContactManagementComponent implements OnInit {
  contacts: Contact[] = [];
  searchTerm: string = '';

  constructor(
    private http: HttpClient,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.loadContacts();
  }

  private getAuthHeaders(): HttpHeaders {
    // Lấy token JWT admin từ localStorage
    const token = localStorage.getItem('token'); 
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  loadContacts() {
    this.http.get<{success: boolean, count: number, data: Contact[]}>(
      'http://localhost:3000/api/admin/contact',
      { headers: this.getAuthHeaders() }
    ).subscribe({
      next: (res) => {
        if(res.success) {
          // Sort theo ngày mới nhất
          this.contacts = res.data.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        } else {
          alert('Không thể tải danh sách liên hệ');
        }
      },
      error: (err) => {
        console.error('Lỗi tải danh sách liên hệ:', err);
        alert('Không thể tải danh sách liên hệ. Hãy chắc admin đã login!');
      }
    });
  }

  deleteContact(_id: string) {
    if (!confirm('Bạn có chắc muốn xóa liên hệ này?')) return;

    this.http.delete<{success: boolean, message: string}>(
      `http://localhost:3000/api/admin/contact/${_id}`,
      { headers: this.getAuthHeaders() }
    ).subscribe({
      next: (res) => {
        if(res.success){
          this.contacts = this.contacts.filter(c => c._id !== _id);
          alert('Xóa thành công!');
        } else {
          alert('Xóa thất bại!');
        }
      },
      error: (err) => {
        console.error('Lỗi xóa liên hệ:', err);
        alert('Xóa thất bại!');
      }
    });
  }

  get filteredContacts() {
    if (!this.searchTerm) return this.contacts;
    const lower = this.searchTerm.toLowerCase();
    return this.contacts.filter(c =>
      c.fullName.toLowerCase().includes(lower) ||
      c.email.toLowerCase().includes(lower) ||
      c.content.toLowerCase().includes(lower)
    );
  }

  formatDate(date: string): string {
    return this.datePipe.transform(date, 'dd-MM-yyyy HH:mm') || date;
  }

  viewDetail(contact: Contact) {
    alert(`Xem chi tiết liên hệ của: ${contact.fullName}\n\nNội dung: ${contact.content}`);
  }
}
