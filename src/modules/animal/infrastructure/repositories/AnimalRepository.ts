import { injectable } from "inversify";
import { prisma } from "../../../../infrastructure/database/prisma/client";
import {
  Animal,
  AnimalCreateDTO,
  AnimalUpdateDTO,
} from "../../../animal/domain/entities/Animal";
import { IAnimalRepository } from "../../../animal/domain/repositories/IAnimalRepository";

@injectable()
export class AnimalRepository implements IAnimalRepository {
  async findById(id: string): Promise<Animal | null> {
    const animal = await prisma.animal.findUnique({
      where: { id },
    });
    return animal ? this.mapToEntity(animal) : null;
  }

  async findByCrotal(crotal: string, userId: string): Promise<Animal | null> {
    const animal = await prisma.animal.findFirst({
      where: { userId, crotal },
    });

    return animal ? this.mapToEntity(animal) : null;
  }

  async findAllByUserId(userId: string): Promise<Animal[]> {
    const animals = await prisma.animal.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    return animals.map((a) => this.mapToEntity(a));
  }

  async create(data: AnimalCreateDTO): Promise<Animal> {
    const animal = await prisma.animal.create({ data });
    return this.mapToEntity(animal);
  }

  async update(id: string, data: AnimalUpdateDTO): Promise<Animal> {
    const animal = await prisma.animal.update({
      where: { id },
      data: { ...data, syncVersion: { increment: 1 } },
    });

    return this.mapToEntity(animal);
  }

  async delete(id: string): Promise<void> {
    await prisma.animal.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        syncStatus: "DELETED",
        syncVersion: { increment: 1 },
      },
    });
  }

  async findPedigree(animalId: string): Promise<Animal | null> {
    const animal = await prisma.animal.findUnique({
      where: { id: animalId },
      include: {
        father: { include: { father: true, mother: true } },
        mother: { include: { father: true, mother: true } },
      },
    });

    return animal ? this.mapToEntity(animal) : null;
  }

  async findParents(
    animalId: string,
  ): Promise<{ father?: Animal; mother?: Animal } | null> {
    const animal = await prisma.animal.findUnique({
      where: { id: animalId },
      include: { father: true, mother: true },
    });

    if (!animal) return null;

    return {
      father: animal.father ? this.mapToEntity(animal.father) : undefined,
      mother: animal.mother ? this.mapToEntity(animal.mother) : undefined,
    };
  }

  async findChildren(animalId: string): Promise<Animal[]> {
    const children = await prisma.animal.findMany({
      where: { OR: [{ fatherId: animalId }, { motherId: animalId }] },
      include: { father: true, mother: true },
    });

    return children.map((c) => this.mapToEntity(c));
  }

  async findBySpecies(userId: string, species: string): Promise<Animal[]> {
    const animals = await prisma.animal.findMany({
      where: { userId, species: species as any, deletedAt: null },
    });

    return animals.map((a) => this.mapToEntity(a));
  }

  async findBySex(userId: string, sex: string): Promise<Animal[]> {
    const animals = await prisma.animal.findMany({
      where: { userId, sex: sex as any, deletedAt: null },
    });

    return animals.map((a) => this.mapToEntity(a));
  }

  async findFounders(userId: string): Promise<Animal[]> {
    const animals = await prisma.animal.findMany({
      where: { userId, isFounder: true, deletedAt: null },
    });

    return animals.map((a) => this.mapToEntity(a));
  }

  private mapToEntity(data: any): Animal {
    return {
      id: data.id,
      crotal: data.crotal,
      sex: data.sex,
      species: data.species,
      birthDate: data.birthDate,
      isFounder: data.isFounder,
      fatherId: data.fatherId,
      motherId: data.motherId,
      father: data.father ? this.mapToEntity(data.father) : undefined,
      mother: data.mother ? this.mapToEntity(data.mother) : undefined,
      children: undefined,
      userId: data.userId,
      syncStatus: data.syncStatus,
      syncVersion: data.syncVersion,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
    };
  }
}
