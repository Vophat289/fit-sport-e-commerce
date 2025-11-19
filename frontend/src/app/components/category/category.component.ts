import { Component, OnInit } from '@angular/core';
import { CategoryService, Category } from '@app/services/category.service';

@Component({
  selector: 'app-category',
  imports: [],
  templateUrl: './category.component.html',
  styleUrl: './category.component.css'
})
export class CategoryComponent implements OnInit{
  categories: Category[] = [];
  newCategory: Partial<Category> = {name: '', description: ''};  

  constructor(private categoryService: CategoryService) {}
 
  ngOnInit(): void {
    this.loadCategories();
  } // 
    
  loadCategories(){
    this.categoryService.getAll().subscribe({
        next: (data) => (this.categories = data),
        error: (err) => console.error('Lỗi tải danh mục:', err),       
    })
  }

  createCategory(){
    if(!this.newCategory.name?.trim()) return;
    this.categoryService.create(this.newCategory).subscribe({
      next: () => {
        this.newCategory = { name: '', description: ''};
        this.loadCategories();
      },
      error: (err) => console.error('Lỗi thêm danh mục:', err),
    })
  }

  deleteCategory(id: string){
    this.categoryService.delete(id).subscribe({
      next: () => this.loadCategories(),
      error: (err) => console.error('Lỗi xóa danh mục', err), 
    })
  }
}