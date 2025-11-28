// src/app/pages/admin-seeder/data-seeder.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { AdminService } from '@app/services/admin.service'; 
import { ProductService } from '@app/services/product.service'; // Bổ sung ProductService
import { Observable } from 'rxjs'; // Cần cho việc subscribe

@Component({
    selector: 'app-data-seeder',
    standalone: true,
    imports: [CommonModule, FormsModule, JsonPipe], 
    template: `
        <div class="seeder-panel">
            <h2>Quản lý Dữ liệu Biến thể (ADMIN)</h2>
            
            <div class="seeder-group">
                <h3>Thêm Kích cỡ & Màu sắc</h3>
                <div class="form-row-inline">
                    <input [(ngModel)]="newSizeName" placeholder="Tên Size (ví dụ: XL)" />
                    <button (click)="submitSize()">Thêm Size</button>
                </div>

                <div class="form-row-inline">
                    <input [(ngModel)]="newColorName" placeholder="Tên Màu (ví dụ: Đen)" />
                    <input type="color" [(ngModel)]="newColorHex" />
                    <button (click)="submitColor()">Thêm Color</button>
                </div>
            </div>
            
            <div class="seeder-group">
                <h3>Tạo Biến thể Sản phẩm</h3>
                <form (ngSubmit)="submitVariant()">
                    <div class="form-row">
                        <label>Sản phẩm:</label>
                        <select [(ngModel)]="selectedProductId" name="product" required>
                            <option value="">-- Chọn sản phẩm --</option>
                            <option *ngFor="let p of products" [value]="p._id">{{ p.name }}</option>
                        </select>
                    </div>

                    <div class="form-row">
                        <label>Kích cỡ:</label>
                        <select [(ngModel)]="selectedSizeId" name="size" required>
                            <option value="">-- Chọn Size --</option>
                            <option *ngFor="let s of sizes" [value]="s._id">{{ s.name }}</option>
                        </select>
                    </div>
                    
                    <div class="form-row">
                        <label>Màu sắc:</label>
                        <select [(ngModel)]="selectedColorId" name="color" required>
                            <option value="">-- Chọn Color --</option>
                            <option *ngFor="let c of colors" [value]="c._id">{{ c.name }}</option>
                        </select>
                    </div>

                    <div class="form-row-inline">
                        <input type="number" [(ngModel)]="inputPrice" name="price" placeholder="Giá bán" min="0" required>
                        <input type="number" [(ngModel)]="inputQuantity" name="quantity" placeholder="Tồn kho" min="0" required>
                    </div>

                    <button type="submit">Tạo Biến thể (Variant)</button>
                </form>
            </div>


                        <h4>Dữ liệu Size/Color Đã tải</h4>
            <p>Sizes ({{ sizes.length }}) | Colors ({{ colors.length }}) | Products ({{ products.length }})</p>
                        <div *ngIf="sizes.length > 0">Sizes: {{ sizes | json }}</div>
        </div>
    `,
    // styleUrl: ['./data-seeder.component.css']
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
        this.adminService.addSize(this.newSizeName).subscribe({
            next: (res: any) => {
                alert(res.message);
                this.newSizeName = '';
                this.loadData(); // ✅ Khắc phục lỗi 3
            },
            error: (err: any) => alert(err.error?.message || 'Lỗi thêm Size.')
        });
    }
    
    submitColor(): void {
        this.adminService.addColor(this.newColorName, this.newColorHex).subscribe({
            next: (res: any) => {
                alert(res.message);
                this.newColorName = '';
                this.loadData(); // ✅ Khắc phục lỗi 4
            },
            error: (err: any) => alert(err.error?.message || 'Lỗi thêm Color.')
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
        
        this.adminService.addProductVariant(payload).subscribe({
            next: (res: any) => {
                alert(res.message);
                this.resetForm();
                this.loadInitialData(); // Tải lại cả Products, Size, Color
            },
            error: (err: any) => alert(err.error?.message || 'Lỗi thêm biến thể.')
        });
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