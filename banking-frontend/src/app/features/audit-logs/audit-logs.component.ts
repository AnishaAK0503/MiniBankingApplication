import { CommonModule } from '@angular/common';
import { afterNextRender, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CsvExportService } from '../../shared/services/csv-export.service';
import { BankingApiService } from '../../core/services/banking-api.service';

interface AuditLog {
  id: number;
  actor: string;
  action: string;
  entityType: string | null;
  entityId: number | null;
  createdAt: string;
}

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-logs.component.html',
  styleUrl: './audit-logs.component.css',
})
export class AuditLogsComponent {
  private readonly csv = inject(CsvExportService);
  logs: AuditLog[] = [];
  private readonly api = inject(BankingApiService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  loading = true;
  error = '';
  constructor() {
    afterNextRender(() => {
      this.api.getAuditLogs().subscribe({
        next: (logs) => {
          this.logs = logs;
          this.loading = false;
          this.changeDetector.detectChanges();
        },
        error: (error) => {
          this.error = error?.error?.message ?? 'Unable to load audit logs.';
          this.loading = false;
          this.changeDetector.detectChanges();
        },
      });
    });
  }
  readonly pageSize = 10;
  currentPage = 1;
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.logs.length / this.pageSize));
  }
  get visibleLogs(): AuditLog[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.logs.slice(start, start + this.pageSize);
  }
  displayActor(actor: string): string {
    return actor === '*' ? 'Role notification' : actor;
  }
  get pageStart(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }
  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.logs.length);
  }
  goToPage(page: number): void {
    this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
  }
  exportCsv(): void {
    this.csv.download(
      'audit-logs.csv',
      ['User', 'Action', 'Entity', 'Time'],
      this.logs.map((log) => [
        this.displayActor(log.actor),
        log.action,
        log.entityType ?? '-',
        log.createdAt,
      ]),
    );
  }
}
