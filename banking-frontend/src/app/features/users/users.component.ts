import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

export type UserRole = 'admin' | 'checker' | 'maker';
export type UserStatus = 'Active' | 'Inactive';

interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  department: string;
  lastLogin: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent {
  readonly users: UserRecord[] = [
    { id: 1, name: 'Anisha', email: 'anisha@minibank.com', role: 'admin', status: 'Active', department: 'Operations', lastLogin: '2026-09-25 10:14' },
    { id: 2, name: 'Rohan', email: 'rohan@minibank.com', role: 'maker', status: 'Active', department: 'Branch Ops', lastLogin: '2026-09-25 09:32' },
    { id: 3, name: 'Meera', email: 'meera@minibank.com', role: 'checker', status: 'Active', department: 'Risk Control', lastLogin: '2026-09-25 08:49' },
    { id: 4, name: 'Karan', email: 'karan@minibank.com', role: 'maker', status: 'Inactive', department: 'Retail Lending', lastLogin: '2026-09-22 15:07' },
    { id: 5, name: 'Nisha', email: 'nisha@minibank.com', role: 'checker', status: 'Active', department: 'Compliance', lastLogin: '2026-09-24 14:05' },
    { id: 6, name: 'Suhail', email: 'suhail@minibank.com', role: 'admin', status: 'Inactive', department: 'Head Office', lastLogin: '2026-09-20 11:48' },
  ];

  roleFilter = 'all';
  statusFilter = 'all';
  searchTerm = '';

  get filteredUsers(): UserRecord[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.users.filter((user) => {
      const matchesRole = this.roleFilter === 'all' || user.role === this.roleFilter;
      const matchesStatus = this.statusFilter === 'all' || user.status === this.statusFilter;
      const matchesSearch =
        !term ||
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.department.toLowerCase().includes(term);

      return matchesRole && matchesStatus && matchesSearch;
    });
  }

  roleLabel(role: UserRole): string {
    return role.toUpperCase();
  }
}
