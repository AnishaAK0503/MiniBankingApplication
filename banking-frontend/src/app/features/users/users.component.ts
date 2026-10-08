import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WorkspaceUserRoleService, WorkspaceUserRecord, WorkspaceUserRole } from '../../core/services/workspace-user-role.service';

export type UserRole = WorkspaceUserRole;
export type UserStatus = 'Active' | 'Inactive';

interface UserRecord extends WorkspaceUserRecord {}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent {
  private readonly workspaceUsers = new WorkspaceUserRoleService();
  readonly users: UserRecord[] = this.workspaceUsers.getWorkspaceUsers();

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
