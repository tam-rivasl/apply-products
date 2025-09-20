export interface CtfSys {
  id: string;
  type: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface CtfEntry<TFields = any> {
  sys: CtfSys;
  fields: TFields;
}

export interface CtfProductFields {
  sku?: string;
  name: string;
  category?: string;
  brand?: string;
  model?: string;
  color?: string;
  currency?: string;
  price?: number;
  stock?: number;
}

export interface CtfListResponse<TFields = any> {
  sys: { type: string };
  total: number;
  skip: number;
  limit: number;
  items: Array<CtfEntry<TFields>>;
  includes?: any;
}
