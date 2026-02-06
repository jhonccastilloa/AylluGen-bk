import { Animal } from "../../../animal/domain/entities/Animal";
import { COICalculationResult, RiskLevel } from "../entities/Breeding";

export class GeneticEngine {
  private relationshipMatrix: Map<string, number> = new Map();

  constructor() {
    this.initializeMatrix();
  }

  private initializeMatrix(): void {
    this.relationshipMatrix.set("parent-child", 0.5);
    this.relationshipMatrix.set("full-siblings", 0.5);
    this.relationshipMatrix.set("half-siblings", 0.25);
    this.relationshipMatrix.set("grandparent-grandchild", 0.25);
    this.relationshipMatrix.set("aunt-uncle-niece-nephew", 0.25);
    this.relationshipMatrix.set("first-cousins", 0.125);
    this.relationshipMatrix.set("half-aunt-uncle", 0.125);
    this.relationshipMatrix.set("great-grandparent-great-grandchild", 0.125);
    this.relationshipMatrix.set("first-cousins-once-removed", 0.0625);
    this.relationshipMatrix.set("second-cousins", 0.03125);
  }

  calculateCOI(
    male: Animal,
    female: Animal,
    pedigree: Map<string, Animal>,
  ): COICalculationResult {
    const relationship = this.calculateRelationship(male, female, pedigree);
    const coi = relationship * 0.5;
    const riskLevel = this.getRiskLevel(coi);

    return {
      coi,
      riskLevel,
      relationship: this.getRelationshipDescription(relationship),
    };
  }

  calculateRelationship(
    male: Animal,
    female: Animal,
    pedigree: Map<string, Animal>,
  ): number {
    if (male.id === female.id) return 1.0;

    const commonAncestors = this.findCommonAncestors(male, female, pedigree, 4);

    if (commonAncestors.length === 0) return 0.0;

    let totalRelationship = 0;

    for (const ancestor of commonAncestors) {
      const malePathLength = this.getPathLength(male.id, ancestor.id, pedigree);
      const femalePathLength = this.getPathLength(
        female.id,
        ancestor.id,
        pedigree,
      );

      if (malePathLength > 0 && femalePathLength > 0) {
        const contribution = Math.pow(0.5, malePathLength + femalePathLength);
        totalRelationship += contribution;
      }
    }

    return Math.min(totalRelationship, 1.0);
  }

  private findCommonAncestors(
    male: Animal,
    female: Animal,
    pedigree: Map<string, Animal>,
    maxDepth: number,
  ): Animal[] {
    const maleAncestors = new Set<string>();
    this.collectAncestors(male, pedigree, maleAncestors, maxDepth);

    const femaleAncestors = new Set<string>();
    this.collectAncestors(female, pedigree, femaleAncestors, maxDepth);

    const commonIds = [...maleAncestors].filter((id) =>
      femaleAncestors.has(id),
    );
    return commonIds.map((id) => pedigree.get(id)!).filter(Boolean);
  }

  private collectAncestors(
    animal: Animal,
    pedigree: Map<string, Animal>,
    ancestors: Set<string>,
    depth: number,
    visited = new Set<string>(),
  ): void {
    if (depth <= 0 || visited.has(animal.id)) return;

    visited.add(animal.id);

    if (animal.fatherId) {
      ancestors.add(animal.fatherId);
      const father = pedigree.get(animal.fatherId);
      if (father) {
        this.collectAncestors(father, pedigree, ancestors, depth - 1, visited);
      }
    }

    if (animal.motherId) {
      ancestors.add(animal.motherId);
      const mother = pedigree.get(animal.motherId);
      if (mother) {
        this.collectAncestors(mother, pedigree, ancestors, depth - 1, visited);
      }
    }
  }

  private getPathLength(
    fromId: string,
    toId: string,
    pedigree: Map<string, Animal>,
  ): number {
    const visited = new Set<string>();
    return this.findPathLength(fromId, toId, pedigree, visited);
  }

  private findPathLength(
    fromId: string,
    toId: string,
    pedigree: Map<string, Animal>,
    visited: Set<string>,
  ): number {
    if (fromId === toId) return 0;
    if (visited.has(fromId)) return -1;

    visited.add(fromId);

    const animal = pedigree.get(fromId);
    if (!animal) return -1;

    let minPath = Infinity;

    if (animal.fatherId) {
      const path = this.findPathLength(
        animal.fatherId,
        toId,
        pedigree,
        visited,
      );
      if (path >= 0 && path < minPath) {
        minPath = path + 1;
      }
    }

    if (animal.motherId) {
      const path = this.findPathLength(
        animal.motherId,
        toId,
        pedigree,
        visited,
      );
      if (path >= 0 && path < minPath) {
        minPath = path + 1;
      }
    }

    return minPath === Infinity ? -1 : minPath;
  }

  private getRiskLevel(coi: number): RiskLevel {
    const percentage = coi * 100;

    if (percentage < 6.25) {
      return RiskLevel.GREEN;
    } else if (percentage <= 12.5) {
      return RiskLevel.YELLOW;
    } else {
      return RiskLevel.RED;
    }
  }

  private getRelationshipDescription(relationship: number): string {
    const percentage = relationship * 100;

    if (percentage >= 87.5) return "Identical";
    if (percentage >= 50) return "Parent-child or full-siblings";
    if (percentage >= 37.5) return "Three-quarters siblings";
    if (percentage >= 25) return "Grandparent-grandchild or half-siblings";
    if (percentage >= 18.75) return "Three-quarter cousins";
    if (percentage >= 12.5)
      return "Great-grandparent, aunt/uncle, or first cousins";
    if (percentage >= 9.375) return "Half-cousins";
    if (percentage >= 6.25)
      return "First cousins once removed or second cousins";
    if (percentage >= 3.125)
      return "Second cousins once removed or third cousins";
    if (percentage >= 1.5625)
      return "Third cousins once removed or fourth cousins";
    return "Distantly related or unrelated";
  }

  getRecommendation(coi: number, riskLevel: RiskLevel): string {
    const percentage = coi * 100;

    if (riskLevel === RiskLevel.GREEN) {
      return "Safe to breed. Low inbreeding risk.";
    } else if (riskLevel === RiskLevel.YELLOW) {
      return `Proceed with caution. Moderate inbreeding risk (${percentage.toFixed(2)}%). Consider alternative matches if available.`;
    } else {
      return `High risk! Inbreeding coefficient is ${percentage.toFixed(2)}%. Do not proceed with this pairing. Find an unrelated mate.`;
    }
  }
}
