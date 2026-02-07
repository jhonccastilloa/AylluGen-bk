export interface IMapper<TDomain, TResponse> {
  toResponse(entity: TDomain): TResponse;
  toResponseList(entities: TDomain[]): TResponse[];
}

export class EntityMapper<
  TDomain extends Record<string, unknown>,
  TResponse extends Record<string, unknown>,
> implements IMapper<
  TDomain,
  TResponse
> {
  toResponse(entity: TDomain): TResponse {
    const response: Partial<TResponse> = {};

    for (const key of Object.keys(entity)) {
      if (key !== "password" && key !== "token" && key !== "secret") {
        (response as Record<string, unknown>)[key] = entity[key];
      }
    }

    return response as TResponse;
  }

  toResponseList(entities: TDomain[]): TResponse[] {
    return entities.map((e) => this.toResponse(e));
  }
}
