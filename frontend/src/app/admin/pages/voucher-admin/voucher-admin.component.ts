import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Voucher, VoucherService } from '../../../services/voucher.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-voucher-admin',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './voucher-admin.component.html',
  styleUrls: ['./voucher-admin.component.css'],
})
export class VoucherAdminComponent implements OnInit {
  vouchers: Voucher[] = [];
  loading = false;
  page = 1;
  limit = 10;
  total = 0;
  search = '';

  form: FormGroup;
  editingVoucherCode: string | null = null;
  showForm = false;
  errorMsg = '';

  constructor(private voucherService: VoucherService, private fb: FormBuilder) {
    this.form = this.fb.group({
      code: ['', Validators.required],
      value: [0, [Validators.required, Validators.min(0)]],
      type: ['percent', Validators.required],
      min_order_value: [0, Validators.min(0)],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      usage_limit: [0, Validators.min(0)],
    });
  }

  ngOnInit(): void {
    this.loadVouchers();
  }

  loadVouchers() {
    this.loading = true;
    this.voucherService.getVouchers(this.page, this.limit, this.search).subscribe({
      next: (res) => {
        this.vouchers = res.vouchers;
        this.total = res.total;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      },
    });
  }

  onSearchChange(value: string) {
    this.search = value;
    this.page = 1;
    this.loadVouchers();
  }

  openCreateForm() {
    this.showForm = true;
    this.editingVoucherCode = null;
    this.form.reset({
      code: '',
      value: 0,
      type: 'percent',
      min_order_value: 0,
      start_date: '',
      end_date: '',
      usage_limit: 0,
    });
  }

  openEditForm(voucher: Voucher) {
    this.showForm = true;
    this.editingVoucherCode = voucher.code;
    this.form.setValue({
      code: voucher.code,
      value: voucher.value,
      type: voucher.type,
      min_order_value: voucher.min_order_value,
      start_date: voucher.start_date?.substring(0, 10),
      end_date: voucher.end_date?.substring(0, 10),
      usage_limit: voucher.usage_limit,
    });
  }

  cancelForm() {
    this.showForm = false;
    this.errorMsg = '';
  }

  submitForm() {
    if (this.form.invalid) {
      this.errorMsg = 'Vui lòng nhập đầy đủ và đúng dữ liệu.';
      return;
    }
    this.errorMsg = '';

    const voucherData = this.form.value;
    if (this.editingVoucherCode) {
      this.voucherService.updateVoucher(this.editingVoucherCode, voucherData).subscribe({
        next: () => {
          this.loadVouchers();
          this.showForm = false;
        },
        error: (err) => {
          this.errorMsg = err.error?.error || 'Lỗi cập nhật voucher';
          console.error(err);
        },
      });
    } else {
      this.voucherService.createVoucher(voucherData).subscribe({
        next: () => {
          this.loadVouchers();
          this.showForm = false;
        },
        error: (err) => {
          this.errorMsg = err.error?.error || 'Lỗi tạo voucher';
          console.error(err);
        },
      });
    }
  }

  deleteVoucher(code: string) {
    if (!confirm('Bạn có chắc chắn muốn xóa voucher này?')) return;
    this.voucherService.deleteVoucher(code).subscribe({
      next: () => this.loadVouchers(),
      error: (err) => {
        alert(err.error?.error || 'Lỗi xóa voucher');
        console.error(err);
      },
    });
  }

  changePage(newPage: number) {
    if (newPage < 1 || newPage > Math.ceil(this.total / this.limit)) return;
    this.page = newPage;
    this.loadVouchers();
  }

get totalPages(): number {
  return Math.ceil(this.total / this.limit);
}

}
