import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FavoriteService, Product } from '../../services/favorite.service';

@Component({
  selector: 'app-favorite',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './favorite.component.html',
  styleUrls: ['./favorite.component.css'],
})
export class FavoriteComponent {

  favorites: Product[] = [];
  loading = true;

  constructor(
    private favoriteService: FavoriteService,
    private router: Router
  ) {}

  ngOnInit() {
    // Lắng nghe danh sách yêu thích
    this.favoriteService.favorites$.subscribe(data => {
      this.favorites = data;
      this.loading = false;
    });
  }

  goToProduct(slug?: string) {
    if (slug) this.router.navigate(['/products', slug]);
  }

  /** Xóa khỏi danh sách yêu thích */
  removeFavorite(product: Product) {
    if (!product._id) return;
    this.favoriteService.removeFavorite(product._id).subscribe({
      next: () => {
        this.favorites = this.favorites.filter(p => p._id !== product._id);
      },
      error: (err) => console.error('Xóa yêu thích thất bại', err)
    });
  }

  /** Toggle yêu thích */
  toggleFavorite(product: Product) {
    if (!product._id) return;
    this.favoriteService.toggleFavorite(product).subscribe({
      next: () => {
        // Cập nhật trạng thái active
        const idx = this.favorites.findIndex(p => p._id === product._id);
        if (idx === -1) {
          this.favorites.push(product);
        } else {
          this.favorites.splice(idx, 1);
        }
      },
      error: (err) => console.error('Toggle yêu thích thất bại', err)
    });
  }

  isFavorite(product: Product) {
    return this.favoriteService.isFavorite(product._id);
  }

}
