export interface CreateRentalRequestPayload {
  propertyId: string;
  moveInDate?: string;
  message?: string;
}

export interface UpdateRentalRequestPayload {
  status: "APPROVED" | "REJECTED";
}

export type RentalStatus =
  | "PENDING"
  | "APPROVED"
  | "ACTIVE"
  | "REJECTED"
  | "COMPLETED";

export interface ValidTransitions {
  PENDING: RentalStatus[];
  APPROVED: RentalStatus[];
  ACTIVE: RentalStatus[];
  REJECTED: RentalStatus[];
  COMPLETED: RentalStatus[];
}
