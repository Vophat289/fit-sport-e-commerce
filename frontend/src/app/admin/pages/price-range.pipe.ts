import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'priceRange',
  standalone: true
})
export class PriceRangePipe implements PipeTransform {

  transform(prices: number[]): string {
    if (!prices || prices.length === 0) return '0';

    const min = Math.min(...prices);
    const max = Math.max(...prices);

    if (min === max) return `${min.toLocaleString()}₫`;
    return `${min.toLocaleString()}₫ - ${max.toLocaleString()}₫`;
  }
}
