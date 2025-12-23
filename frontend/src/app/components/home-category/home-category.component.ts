import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CategoryService, Category} from '@app/services//category.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-home-category',
  imports: [CommonModule],
  templateUrl: './home-category.component.html',
  styleUrl: './home-category.component.css'
})
export class HomeCategoryComponent implements OnInit, AfterViewInit {
  @ViewChild('categoryList', { static: false }) categoryList!: ElementRef<HTMLDivElement>;
  
  categories: Category[] = [];
  loading = true;
  canScrollLeft = false;
  canScrollRight = true;
  
  // Drag to scroll
  isDown = false;
  startX = 0;
  startScrollLeft = 0;
  hasMoved = false;

  constructor(private categoryService: CategoryService, private router: Router){}

  ngOnInit(){
    this.loadCategories();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.checkScrollButtons();
      this.setupDragScroll();
    }, 100);
  }

  setupDragScroll() {
    if (!this.categoryList) return;
    
    const element = this.categoryList.nativeElement;
    
    // Mouse events
    element.addEventListener('mousedown', (e) => {
      this.isDown = true;
      this.hasMoved = false;
      element.style.cursor = 'grabbing';
      this.startX = e.pageX - element.offsetLeft;
      this.startScrollLeft = element.scrollLeft;
    });

    element.addEventListener('mouseleave', () => {
      this.isDown = false;
      element.style.cursor = 'grab';
    });

    element.addEventListener('mouseup', () => {
      this.isDown = false;
      element.style.cursor = 'grab';
    });

    element.addEventListener('mousemove', (e) => {
      if (!this.isDown) return;
      e.preventDefault();
      this.hasMoved = true;
      const x = e.pageX - element.offsetLeft;
      const walk = (x - this.startX) * 2; // Scroll speed
      element.scrollLeft = this.startScrollLeft - walk;
      this.checkScrollButtons();
    });

    // Touch events for mobile
    let touchStartX = 0;
    let touchScrollLeft = 0;
    let touchHasMoved = false;

    element.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].pageX - element.offsetLeft;
      touchScrollLeft = element.scrollLeft;
      touchHasMoved = false;
    });

    element.addEventListener('touchmove', (e) => {
      e.preventDefault();
      touchHasMoved = true;
      const x = e.touches[0].pageX - element.offsetLeft;
      const walk = (x - touchStartX) * 2;
      element.scrollLeft = touchScrollLeft - walk;
      this.checkScrollButtons();
    });
  }

  loadCategories(){
    this.categoryService.getAll().subscribe({
      next: (data) => {
        this.categories = data;
        this.loading = false;
        setTimeout(() => {
          this.checkScrollButtons();
        }, 100);
      },
      error: (err) => {
        console.error('Không tìm thấy danh mục: ', err);
        this.loading = false;
      }   
    })
  }

  scrollLeft() {
    if (this.categoryList) {
      const scrollAmount = this.categoryList.nativeElement.clientWidth;
      this.categoryList.nativeElement.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    }
  }

  scrollRight() {
    if (this.categoryList) {
      const scrollAmount = this.categoryList.nativeElement.clientWidth;
      this.categoryList.nativeElement.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  }

  onScroll() {
    this.checkScrollButtons();
  }

  checkScrollButtons() {
    if (!this.categoryList) return;
    
    const element = this.categoryList.nativeElement;
    this.canScrollLeft = element.scrollLeft > 0;
    this.canScrollRight = element.scrollLeft < (element.scrollWidth - element.clientWidth - 10);
  }

  goToCategory(slug: string){
    this.router.navigate(['/products'], {
      queryParams: {category: slug},
    })
  }

  handleCardClick(slug: string) {
    // Chỉ navigate nếu không phải là drag
    if (!this.hasMoved) {
      this.goToCategory(slug);
    }
    // Reset flag
    this.hasMoved = false;
  }
}
