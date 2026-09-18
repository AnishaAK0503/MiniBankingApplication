import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { CsvExportService } from '../../shared/services/csv-export.service';

@Component({ selector: 'app-audit-logs', standalone: true, imports: [CommonModule], templateUrl: './audit-logs.component.html', styleUrl: './audit-logs.component.css' })
export class AuditLogsComponent {
  private readonly csv = inject(CsvExportService);
  logs = JSON.parse(localStorage.getItem('mini-banking-audit-logs') ?? '[]');
  readonly pageSize = 10;
  currentPage = 1;
  get totalPages(): number { return Math.max(1, Math.ceil(this.logs.length / this.pageSize)); }
  get visibleLogs(): any[] { const start = (this.currentPage - 1) * this.pageSize; return this.logs.slice(start, start + this.pageSize); }
  get pageStart(): number { return (this.currentPage - 1) * this.pageSize + 1; }
  get pageEnd(): number { return Math.min(this.currentPage * this.pageSize, this.logs.length); }
  goToPage(page: number): void { this.currentPage = Math.min(Math.max(page, 1), this.totalPages); }
  exportCsv(): void { this.csv.download('audit-logs.csv', ['User', 'Action', 'Entity', 'Time'], this.logs.map((log: any) => [log.user, log.action, log.entity, log.time])); }
}
