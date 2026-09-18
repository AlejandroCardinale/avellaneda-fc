import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NewsService, News } from '../../services/news.service';

@Component({
  selector: 'app-noticias',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './noticias.component.html',
  styleUrl: './noticias.component.css'
})
export class NoticiasComponent implements OnInit {
  allNews: News[] = [];
  filteredNews: News[] = [];
  featured: News[] = [];
  categories: string[] = [];
  activeCategory = 'Todas';
  searchQuery = '';
  loading = true;
  errorMessage = '';

  categoryCounts: Record<string, number> = {};

  constructor(private newsService: NewsService) {}

  ngOnInit() {
    this.categories = this.newsService.getCategories();
    this.newsService.getPublicNews().subscribe({
      next: (news) => {
        this.allNews = news;
        this.featured = news.filter(n => n.featured);
        this.filteredNews = [...news];
        this.updateCategoryCounts();
        this.loading = false;
      },
      error: () => {
        this.allNews = [];
        this.filteredNews = [];
        this.featured = [];
        this.loading = false;
        this.errorMessage = 'No se pudieron cargar las noticias.';
      }
    });
  }

  private updateCategoryCounts(): void {
    this.categories.forEach(cat => {
      this.categoryCounts[cat] = cat === 'Todas'
        ? this.allNews.length
        : this.allNews.filter(n => n.category === cat).length;
    });
  }

  filterBy(cat: string) {
    this.activeCategory = cat;
    this.applyFilters();
  }

  onSearch() { this.applyFilters(); }

  applyFilters() {
    let result = this.activeCategory === 'Todas'
      ? [...this.allNews]
      : this.allNews.filter(n => n.category === this.activeCategory);
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(n => n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q));
    }
    this.filteredNews = result;
  }
}
