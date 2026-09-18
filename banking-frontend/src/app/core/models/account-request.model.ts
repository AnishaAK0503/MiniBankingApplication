export interface AccountRequest {
  id: number;
  customerId: number;
  customerName: string;
  accountType: string;
  remarks: string;
  status: string;
  requestedAt: string;
  reviewedByMaker?: string;
  rejectionReason?: string;
}