import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactService } from '../../../services/contact.service';
import { NotificationService } from '../../../services/notification.service';

interface Contact {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  content: string;
  createdAt: string;
}

@Component({
  selector: 'app-contacts-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contacts-admin.component.html',
  styleUrls: ['./contacts-admin.component.css']
})
export class ContactsAdminComponent implements OnInit {
  contacts: Contact[] = [];
  page = 1;
  limit = 10;
  totalPages = 1;
  search = '';

  loading = false;
  errorMsg = '';

  constructor(
    private contactService: ContactService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.getContacts();
  }

  getContacts(): void {
    this.loading = true;
    this.errorMsg = '';

    this.contactService.getContacts(this.page, this.limit, this.search).subscribe({
      next: (res: any) => {
        this.contacts = res.data;
        this.totalPages = res.totalPages;
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Không thể tải dữ liệu hoặc token không hợp lệ';
        this.loading = false;
      }
    });
  }

  deleteContact(id: string): void {
    this.notification.confirmDelete('liên hệ này').then((confirmed) => {
      if (!confirmed) return;

      this.contactService.deleteContact(id).subscribe({
        next: (res: any) => {
          this.notification.success('Xóa thành công!');
          this.getContacts();
        },
        error: () => {
          this.notification.error('Không thể xóa liên hệ');
        }
      });
    });
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.getContacts();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.getContacts();
    }
  }

  onSearch(): void {
    this.page = 1;
    this.getContacts();
  }

openCreateForm(): void {
    this.notification.info('Chức năng tạo liên hệ mới sẽ được mở ở đây!');
  }
}