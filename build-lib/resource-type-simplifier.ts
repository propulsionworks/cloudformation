import type { TypeSimplifier } from "./code-generator.ts";
import {
  simplifyUnionType,
  type ResourceType,
  type SymbolName,
  type Type,
} from "./type-nodes.ts";

/**
 * The context of the type being simplified.
 */
export type ResourceTypeSimplifierMode = "attributes" | "model" | "resource";

/**
 * Options for creating a {@link ResourceTypeSimplifier} instance.
 */
export type ResourceTypeSimplifierOptions = {
  mode?: ResourceTypeSimplifierMode | undefined;
  tagType?: SymbolName | undefined;
};

export class ResourceTypeSimplifier implements TypeSimplifier {
  readonly #tagType: SymbolName | undefined;

  public readonly resource: ResourceType;
  public mode: ResourceTypeSimplifierMode;

  public constructor(
    resource: ResourceType,
    options: ResourceTypeSimplifierOptions = {},
  ) {
    this.resource = resource;
    this.mode = options.mode ?? "resource";
    this.#tagType = options.tagType;
  }

  public simplifyType(node: Type): Type {
    if (node.type === "object") {
      if (this.mode === "model") {
        return node;
      }
      if (this.mode === "attributes") {
        const properties = Object.fromEntries(
          Object.entries(node.properties).filter(
            ([, property]) => property.isAttribute,
          ),
        );

        return {
          type: "object",
          id: node.id,
          properties,
          required: Object.keys(properties),
        };
      }

      const properties = Object.fromEntries(
        Object.entries(node.properties).filter(
          ([, property]) => !property.readOnly,
        ),
      );

      return {
        type: "object",
        id: node.id,
        properties,
        required: node.required.filter((x) => x in properties),
      };
    }
    if (node.type === "reference") {
      const name = node.name;
      if (typeof name !== "string" || !this.resource.definitions[name]) {
        return node;
      }
      const target = this.resource.definitions[name].type;
      if (/Tags?$/.test(name) && this.#tagType && this.isTagObject(target)) {
        return {
          type: "reference",
          id: node.id,
          name: this.#tagType,
        };
      }
      if (this.shouldInline(target)) {
        return this.simplifyType(target);
      }
    }
    if (node.type === "union") {
      return simplifyUnionType({
        ...node,
        items: node.items.map((x) => this.simplifyType(x)),
      });
    }
    return node;
  }

  protected isTagObject(target: Type): boolean {
    return (
      target.type === "object" &&
      Object.keys(target.properties).length === 2 &&
      target.properties["Key"]?.type.type === "string" &&
      target.properties["Value"]?.type.type === "string"
    );
  }

  protected shouldInline(target: Type): boolean {
    return (
      target.type !== "enum" &&
      (target.type !== "object" || this.mode === "attributes") &&
      target.type !== "union"
    );
  }
}
