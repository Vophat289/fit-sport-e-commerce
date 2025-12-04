// src/app/pages/admin-seeder/data-seeder.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { AdminService } from '@app/services/admin.service'; 
import { ProductService } from '@app/services/product.service'; // Bổ sung ProductService
import { Observable } from 'rxjs'; // Cần cho việc subscribe

@Component({
    selector: 'app-data-seeder',
    standalone: true,
    imports: [CommonModule, FormsModule], 
    templateUrl: './data-seeder.component.html',
    styleUrls: ['./data-seeder.component.css']
})
export class DataSeederComponent implements OnInit {
    // Biến cho SIZE/COLOR Seeder
    newSizeName: string = '';
    newColorName: string = '';
    newColorHex: string = '#000000';
    
    // Biến cho Variant Creator
    products: any[] = [];
    sizes: any[] = [];
    colors: any[] = [];
    selectedProductId: string = '';
    selectedSizeId: string = '';
    selectedColorId: string = '';
    inputPrice: number = 0;
    inputQuantity: number = 1;

    // Loading states
    isSubmittingSize: boolean = false;
    isSubmittingColor: boolean = false;
    isSubmittingVariant: boolean = false;

    // Message
    message: { type: 'success' | 'error'; text: string } | null = null;

    constructor(
        private adminService: AdminService,
        private productService: ProductService // Cần để lấy danh sách Product
    ) {}

    ngOnInit(): void {
        this.loadInitialData();
    }

    // ✅ HÀM MỚI (Khắc phục lỗi 3 & 4)
    loadData(): void {
        // Tải danh sách Size và Color 
        this.adminService.getAllSizes().subscribe((data: any) => this.sizes = data);
        this.adminService.getAllColors().subscribe((data: any) => this.colors = data);
    }

    loadInitialData(): void {
        // Tải danh sách Product (Chỉ cần ID và Tên)
        // ✅ Sửa lỗi 2: Định kiểu cho data
        this.adminService.getAllProductsBasic().subscribe((data: any) => this.products = data); 
        
        this.loadData(); // Gọi hàm load Data mới
    }
    
    // --- SIZE & COLOR SUBMIT LOGIC ---
    submitSize(): void {
        if (!this.newSizeName.trim()) return;
        
        this.isSubmittingSize = true;
        this.adminService.addSize(this.newSizeName.trim()).subscribe({
            next: (res: any) => {
                this.showMessage('success', res.message || 'Thêm kích cỡ thành công!');
                this.newSizeName = '';
                this.loadData();
                this.isSubmittingSize = false;
            },
            error: (err: any) => {
                this.showMessage('error', err.error?.message || 'Lỗi thêm kích cỡ.');
                this.isSubmittingSize = false;
            }
        });
    }
    
    submitColor(): void {
        if (!this.newColorName.trim()) return;
        
        this.isSubmittingColor = true;
        this.adminService.addColor(this.newColorName.trim(), this.newColorHex).subscribe({
            next: (res: any) => {
                this.showMessage('success', res.message || 'Thêm màu sắc thành công!');
                this.newColorName = '';
                this.loadData();
                this.isSubmittingColor = false;
            },
            error: (err: any) => {
                this.showMessage('error', err.error?.message || 'Lỗi thêm màu sắc.');
                this.isSubmittingColor = false;
            }
        });
    }

    // --- VARIANT SUBMIT LOGIC ---
    submitVariant(): void {
        const payload = {
            product_id: this.selectedProductId,
            size_id: this.selectedSizeId,
            color_id: this.selectedColorId,
            price: this.inputPrice,
            quantity: this.inputQuantity
        };
        
        this.isSubmittingVariant = true;
        this.adminService.addProductVariant(payload).subscribe({
            next: (res: any) => {
                this.showMessage('success', res.message || 'Tạo biến thể thành công!');
                this.resetForm();
                this.loadInitialData();
                this.isSubmittingVariant = false;
            },
            error: (err: any) => {
                this.showMessage('error', err.error?.message || 'Lỗi tạo biến thể.');
                this.isSubmittingVariant = false;
            }
        });
    }

    // Helper methods
    showMessage(type: 'success' | 'error', text: string): void {
        this.message = { type, text };
        setTimeout(() => {
            this.message = null;
        }, 5000);
    }

    getContrastColor(hex: string): string {
        if (!hex) return '#000';
        // Convert hex to RGB
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        // Calculate brightness
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#000' : '#fff';
    }

    resetForm(): void {
        // Reset form Variant
        this.selectedProductId = '';
        this.selectedSizeId = '';
        this.selectedColorId = '';
        this.inputPrice = 0;
        this.inputQuantity = 1;
    }
}