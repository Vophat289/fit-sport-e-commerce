import { Component, OnInit } from '@angular/core';
import { CategoryService, Category} from '@app/services//category.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'
@Component({
  selector: 'app-home-category',
  imports: [CommonModule],
  templateUrl: './home-category.component.html',
  styleUrl: './home-category.component.css'
})
export class HomeCategoryComponent implements OnInit{
  categories: Category[] = [];
  loading = true

  constructor(private categoryService: CategoryService, private router: Router){}

 ngOnInit(){
  this.loadCategories();
 }

 loadCategories(){
  this.categoryService.getAll().subscribe({
    next: (data) => (this.categories = data, this.loading),
    error: (err) => console.error('Không tìm thấy danh mục: ', err)   
  })
 }

 goToCategory(slug: string){
  this.router.navigate(['/products'], {
    queryParams: {category: slug},
  })
 }
}
