import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CsvExportService } from '../../shared/services/csv-export.service';
import { retry, timeout } from 'rxjs';

@Component({ selector: 'app-users', standalone: true, imports: [CommonModule], templateUrl: './users.component.html', styleUrl: './users.component.css' })
export class UsersComponent {
  readonly auth = inject(AuthService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly csv = inject(CsvExportService);
  users: any[] = [];
  loading = true;
  error = '';
  readonly pageSize = 10;
  currentPage = 1;
  constructor() { this.load(); }
  load(): void {
    this.loading = true;
    this.error = '';
    this.auth.getBackendUsers().pipe(retry({ count: 2, delay: 500 }), timeout({ each: 5000 })).subscribe({
      next: users => { this.users = users; this.currentPage = 1; this.loading = false; this.changeDetector.detectChanges(); },
      error: error => {
        this.loading = false;
        this.error = error?.name === 'TimeoutError'
          ? 'User list loading timed out. Check that the backend and database are running.'
          : 'Unable to load users. Check that the backend is running.';
        this.changeDetector.detectChanges();
      }
    });
  }
  get totalPages(): number { return Math.max(1, Math.ceil(this.users.length / this.pageSize)); }
  get visibleUsers(): any[] { const start = (this.currentPage - 1) * this.pageSize; return this.users.slice(start, start + this.pageSize); }
  get pageStart(): number { return (this.currentPage - 1) * this.pageSize + 1; }
  get pageEnd(): number { return Math.min(this.currentPage * this.pageSize, this.users.length); }
  goToPage(page: number): void { this.currentPage = Math.min(Math.max(page, 1), this.totalPages); }
  exportCsv(): void { this.csv.download('users.csv', ['Name', 'Email', 'Role', 'Status'], this.users.map(user => [user.name, user.email, user.role, user.active ? 'Active' : 'Disabled'])); }
}
