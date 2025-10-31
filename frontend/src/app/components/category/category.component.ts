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
  } 
    
  loadCategories(){
    this.categoryService.getAllCategories().subscribe({
        next: (data) => (this.categories = data),
        error: (err) => console.error('Lỗi tải danh mục:', err),       
    })
  }

  createCategory(){
    if(!this.newCategory.name?.trim()) return;
  }
}