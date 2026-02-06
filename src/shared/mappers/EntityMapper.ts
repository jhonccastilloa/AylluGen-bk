export interface IMapper<TDomain, TResponse> {
  toResponse(entity: TDomain): TResponse;
  toResponseList(entities: TDomain[]): TResponse[];
}

export class EntityMapper<TDomain, TResponse> implements IMapper<
  TDomain,
  TResponse
> {
  toResponse(entity: TDomain): TResponse {
    const response: any = {};
    for (const key in entity) {
      if (key !== "password" && key !== "token" && key !== "secret") {
        response[key] = (entity as any)[key];
      }
    }
    return response as TResponse;
  }

  toResponseList(entities: TDomain[]): TResponse[] {
    return entities.map((e) => this.toResponse(e));
  }
}
