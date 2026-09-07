export type RegisterRequestDto = {
  email: string;
  name: string;
  organizationName?: string;
  password: string;
};

export type LoginRequestDto = {
  email: string;
  password: string;
};

export type AuthUserDto = {
  id: string;
  email: string;
  name: string;
};

export type AuthOrganizationDto = {
  id: string;
  name: string;
  role: "OWNER";
};

export type AuthResponseDto = {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDto;
  organization?: AuthOrganizationDto;
};
