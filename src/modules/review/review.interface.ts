export interface CreateReviewPayload {
  rentalRequestId: string;
  rating: number;
  comment?: string;
}