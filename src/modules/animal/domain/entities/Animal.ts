export enum Sex {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export enum Species {
  SHEEP = "SHEEP",
  ALPACA = "ALPACA",
  LLAMA = "LLAMA",
  VICUGNA = "VICUGNA",
}

export enum SyncStatus {
  SYNCED = "SYNCED",
  PENDING = "PENDING",
  CONFLICT = "CONFLICT",
  DELETED = "DELETED",
}

export interface Animal {
  id: string;
  crotal: string;
  sex: Sex;
  species: Species;
  birthDate?: Date;
  isFounder: boolean;
  fatherId?: string;
  motherId?: string;
  father?: Animal;
  mother?: Animal;
  children?: Animal[];
  userId: string;
  syncStatus: SyncStatus;
  syncVersion: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface AnimalCreateDTO {
  crotal: string;
  sex: Sex;
  species: Species;
  birthDate?: Date;
  isFounder: boolean;
  fatherId?: string;
  motherId?: string;
  userId: string;
}

export interface AnimalUpdateDTO {
  crotal?: string;
  birthDate?: Date;
  isFounder?: boolean;
  fatherId?: string;
  motherId?: string;
}
