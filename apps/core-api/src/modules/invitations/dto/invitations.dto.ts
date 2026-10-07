export type InvitationRole = "ADMIN" | "ACCOUNTANT" | "VIEWER";

export type CreateInvitationRequestDto = {
  email: string;
  role: InvitationRole;
};

export type ListInvitationsQuery = {
  limit: number;
  offset: number;
};

export type InvitationDto = {
  id: string;
  email: string;
  role: InvitationRole;
  status: "PENDING" | "ACCEPTED" | "REVOKED";
  isExpired: boolean;
  expiresAt: string;
  createdAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
};

export type CreateInvitationResponseDto = {
  invitation: InvitationDto;
  acceptToken: string;
};

export type InvitationListDto = {
  data: InvitationDto[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
};
