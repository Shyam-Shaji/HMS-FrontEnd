export type BedStatus = 'vacant' | 'occupied' | 'cleaning' | 'maintenance';

export interface Ward {
  _id: string;
  name: string;
  type: string;
  floor?: string;
  chargesPerDay: number;
}

export interface Bed {
  _id: string;
  wardId: string;
  bedNumber: string;
  status: BedStatus;
}

export interface WardBoardEntry {
  ward: Ward;
  beds: Bed[];
}
