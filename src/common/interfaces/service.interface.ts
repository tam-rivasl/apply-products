export interface IBaseService {
  // Common service methods can be defined here
}

export interface IProductsService extends IBaseService {
  findAll(filters: any): Promise<any>;
  create(dto: any): Promise<any>;
  update(id: string, dto: any): Promise<any>;
  remove(id: string): Promise<any>;
}

export interface ISyncService extends IBaseService {
  runOnce(): Promise<void>;
  handleCron(): Promise<void>;
}

export interface IAuthService extends IBaseService {
  login(email?: string): Promise<{ access_token: string }>;
}

export interface IReportsService extends IBaseService {
  overview(query: any): Promise<any>;
  byCategory(query: any): Promise<any>;
}
