export interface Account {
  id: number;
  accountNumber: string;
  accountType: string;
  balance: number;
  customerId: number;
  customerName: string;
  status?: string;
  createdAt?: string;
}
