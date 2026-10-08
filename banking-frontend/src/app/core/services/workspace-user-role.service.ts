export type WorkspaceUserRole = 'admin' | 'checker' | 'maker' | 'customer';
export type WorkspaceUserStatus = 'Active' | 'Inactive';

export interface WorkspaceUserRecord {
  id: number;
  name: string;
  email: string;
  role: WorkspaceUserRole;
  status: WorkspaceUserStatus;
  department: string;
  lastLogin: string;
}

export interface WorkspaceUserRoleSummary {
  customer: number;
  maker: number;
  checker: number;
  admin: number;
}

const workspaceUsers: WorkspaceUserRecord[] = [
  { id: 1, name: 'Anisha', email: 'anisha@minibank.com', role: 'admin', status: 'Active', department: 'Operations', lastLogin: '2026-09-25 10:14' },
  { id: 2, name: 'Rohan', email: 'rohan@minibank.com', role: 'maker', status: 'Active', department: 'Branch Ops', lastLogin: '2026-09-25 09:32' },
  { id: 3, name: 'Meera', email: 'meera@minibank.com', role: 'checker', status: 'Active', department: 'Risk Control', lastLogin: '2026-09-25 08:49' },
  { id: 4, name: 'Karan', email: 'karan@minibank.com', role: 'maker', status: 'Inactive', department: 'Retail Lending', lastLogin: '2026-09-22 15:07' },
  { id: 5, name: 'Nisha', email: 'nisha@minibank.com', role: 'checker', status: 'Active', department: 'Compliance', lastLogin: '2026-09-24 14:05' },
  { id: 6, name: 'Suhail', email: 'suhail@minibank.com', role: 'admin', status: 'Inactive', department: 'Head Office', lastLogin: '2026-09-20 11:48' },
];

export class WorkspaceUserRoleService {
  getWorkspaceUsers(): WorkspaceUserRecord[] {
    return workspaceUsers.map((user) => ({ ...user }));
  }

  getRoleSummary(): WorkspaceUserRoleSummary {
    return workspaceUsers.reduce<WorkspaceUserRoleSummary>(
      (summary, user) => {
        summary[user.role] += 1;
        return summary;
      },
      { customer: 0, maker: 0, checker: 0, admin: 0 },
    );
  }
}
