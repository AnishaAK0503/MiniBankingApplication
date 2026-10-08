export interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
  accountId: number;
  referenceId?: string;
  balanceAfter?: number;
}

export interface TransactionApprovalRequest {
  id: number;
  accountId: number;
  accountNumber: string;
  customerName: string;
  amount: number;
  type: string;
  description?: string;
  referenceNumber: string;
  status: string;
  requestedBy: string;
  approvedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
  transactionId?: number;
}
