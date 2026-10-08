import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { Account } from '../../../core/models/account.model';

@Component({
  selector: 'app-account-select',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="account-picker" [class.open]="open">
      <button #trigger type="button" class="account-picker-trigger" [class.no-balance]="!showBalance" (click)="toggle()" [attr.aria-expanded]="open" aria-haspopup="listbox">
        <ng-container *ngIf="selected; else placeholder">
          <span class="picker-name">{{ selected.customerName || 'Account' }}</span>
          <span class="picker-number">{{ mask(selected.accountNumber) }}</span>
          <span class="picker-balance" *ngIf="showBalance">₹{{ selected.balance | number:'1.2-2' }}</span>
        </ng-container>
        <ng-template #placeholder><span class="picker-placeholder">{{ placeholderText }}</span></ng-template>
        <span class="picker-chevron" aria-hidden="true">⌄</span>
      </button>
      <div class="account-picker-panel" *ngIf="open" role="listbox">
        <button type="button" class="account-picker-option" *ngFor="let account of accounts" (click)="choose(account)" [class.selected]="account.id === selectedId" role="option" [attr.aria-selected]="account.id === selectedId">
          <span class="picker-name">{{ account.customerName || 'Account' }}</span>
          <span class="picker-number">{{ mask(account.accountNumber) }}</span>
          <span class="picker-balance" *ngIf="showBalance">₹{{ account.balance | number:'1.2-2' }}</span>
        </button>
        <p class="picker-empty" *ngIf="!accounts.length">No accounts available</p>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .account-picker { position: relative; width: 100%; }
    .account-picker-trigger, .account-picker-option { width: 100%; color: #f5f7fa; background: #0d1b2e; border: 1px solid #263b55; }
    .account-picker-trigger { min-height: 44px; display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(92px, .8fr) minmax(104px, .75fr) 18px; gap: 10px; align-items: center; padding: 10px 14px; text-align: left; border-radius: 10px; }
    .account-picker-trigger.no-balance { grid-template-columns: minmax(0, 1fr) 18px; }
    .account-picker.open .account-picker-trigger, .account-picker-trigger:focus-visible { border-color: #2563eb; outline: 2px solid rgba(37,99,235,.25); }
    .account-picker-panel { position: absolute; z-index: 20; left: 0; right: 0; top: calc(100% + 5px); max-height: 330px; overflow-y: auto; padding: 5px; background: #0f1f33; border: 1px solid #263b55; border-radius: 9px; box-shadow: 0 8px 24px rgba(0,0,0,.3); }
    .account-picker-option { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(92px, .8fr) minmax(104px, .75fr); gap: 10px; align-items: center; min-height: 44px; padding: 10px 12px; border: 0; border-left: 2px solid transparent; border-radius: 6px; text-align: left; }
    .account-picker-option:hover, .account-picker-option.selected { background: #183b63; border-left-color: #2563eb; }
    .picker-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
    .picker-number { color: #b8c7d9; white-space: nowrap; }
    .picker-balance { color: #dce8f5; text-align: right; white-space: nowrap; font-weight: 600; }
    .picker-placeholder, .picker-empty { color: #a9b8ca; }
    .picker-chevron { color: #a9b8ca; text-align: right; font-size: 18px; }
    .picker-empty { margin: 10px 12px; }
    @media (max-width: 480px) { .account-picker-trigger, .account-picker-option { grid-template-columns: minmax(0, 1fr) auto; gap: 6px; } .account-picker-trigger.no-balance { grid-template-columns: minmax(0, 1fr) 18px; } .picker-balance { grid-column: 2; grid-row: 1; } .picker-number { grid-column: 1; grid-row: 2; } .picker-chevron { grid-column: 2; grid-row: 1; } }
  `],
})
export class AccountSelectComponent {
  @Input() accounts: Account[] = [];
  @Input() selectedId = 0;
  @Input() placeholderText = 'Select account';
  @Input() showBalance = true;
  @Output() selectedIdChange = new EventEmitter<number>();
  @ViewChild('trigger') trigger?: ElementRef<HTMLButtonElement>;
  open = false;

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent): void {
    if (!this.trigger?.nativeElement.closest('.account-picker')?.contains(event.target as Node)) this.open = false;
  }
  toggle(): void { this.open = !this.open; }
  choose(account: Account): void {
    this.selectedId = account.id;
    this.selectedIdChange.emit(account.id);
    this.open = false;
  }
  mask(value: string): string { return value ? `••••${value.slice(-4)}` : ''; }
  get selected(): Account | undefined { return this.accounts.find((account) => account.id === this.selectedId); }
}
