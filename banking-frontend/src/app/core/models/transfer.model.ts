export interface Transfer {
  id: number;
  referenceNumber: string;
  sourceAccountId: number;
  sourceAccountNumber: string;
  destinationAccountId: number;
  destinationAccountNumber: string;
  destinationCustomerName: string;
  amount: number;
  description?: string;
  status: 'COMPLETED' | 'FAILED' | 'PENDING' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  initiatedBy?: string;
  approvedBy?: string;
  createdAt: string;
  completedAt?: string;
  rejectionReason?: string;
}

export interface TransferCreate {
  sourceAccountId: number;
  destinationAccountId?: number;
  destinationAccountNumber?: string;
  amount: number;
  description?: string;
}