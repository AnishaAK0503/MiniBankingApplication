export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  referenceType?: string;
  referenceId?: number;
  read: boolean;
  createdAt: string;
}
