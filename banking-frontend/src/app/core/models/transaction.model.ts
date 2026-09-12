export interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
  accountId: number;
}
