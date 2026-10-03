import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { NewsService, News } from '../../services/news.service';

@Component({
  selector: 'app-noticia-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './noticia-detalle.component.html',
  styleUrl: './noticia-detalle.component.css'
})
export class NoticiaDetalleComponent implements OnInit {
  newsItem: News | null = null;
  loading = true;
  notFound = false;
  relatedNews: News[] = [];
  copied = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private newsService: NewsService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (!idParam) {
        this.notFound = true;
        this.loading = false;
        return;
      }

      this.loading = true;
      this.notFound = false;
      this.loadArticle(idParam);
    });
  }

  loadArticle(id: string): void {
    this.newsService.getPublicNewsById(id).subscribe({
      next: (article) => {
        this.newsItem = article;
        this.loading = false;
        this.loadRelated(article.id, article.category);
      },
      error: () => {
        // Intentar fallback local si el backend no responde o el ID es mock
        const fallback = this.newsService.getById(id);
        if (fallback) {
          this.newsItem = fallback;
          this.loading = false;
          this.loadRelated(fallback.id, fallback.category);
        } else {
          this.notFound = true;
          this.loading = false;
        }
      }
    });
  }

  loadRelated(currentId: number, category: string): void {
    this.newsService.getPublicNews().subscribe({
      next: (all) => {
        this.relatedNews = all.filter(n => n.id !== currentId).slice(0, 3);
        if (this.relatedNews.length === 0) {
          this.relatedNews = this.newsService.getAll().filter(n => n.id !== currentId).slice(0, 3);
        }
      },
      error: () => {
        this.relatedNews = this.newsService.getAll().filter(n => n.id !== currentId).slice(0, 3);
      }
    });
  }

  getParagraphs(): string[] {
    if (!this.newsItem?.content) return [];
    return this.newsItem.content
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }

  copyLink(): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.copied = true;
        setTimeout(() => this.copied = false, 2500);
      });
    }
  }

  shareWhatsapp(): void {
    if (typeof window !== 'undefined' && this.newsItem) {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(`Leé esta noticia de Avellaneda FC: "${this.newsItem.title}" - `);
      window.open(`https://api.whatsapp.com/send?text=${text}${url}`, '_blank');
    }
  }
}
