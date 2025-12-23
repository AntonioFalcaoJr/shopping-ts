export interface IProjectionGateway {
  findById<T>(collectionName: string, id: string): Promise<T | null>;
  findAll<T>(collectionName: string): Promise<T[]>;
  findByCustomerId<T>(collectionName: string, customerId: string): Promise<T[]>;
}
