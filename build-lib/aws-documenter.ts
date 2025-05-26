import type {
  ObjectSupplemental,
  ResourceSupplemental,
} from "@propulsionworks/cfn-resource-schemas/types";
import assert from "node:assert";
import type { ResourceDocumenter } from "../build-lib/resource-builder.ts";
import type { TypeDocumentation } from "../build-lib/type-nodes.ts";

/**
 * Implementation of {@link ResourceDocumenter} that uses supplemental data from
 * `@propulsionworks/cfn-resource-schemas` to provide improved documentation.
 */
export class AwsDocumenter implements ResourceDocumenter {
  readonly #data: Record<string, ResourceSupplemental> = {};

  public constructor(data: Iterable<ResourceSupplemental>) {
    for (const item of data) {
      this.#data[item.typeName] = item;
    }
  }

  public getAttributeDocs(
    typeName: string,
    propertyName?: string,
  ): TypeDocumentation | undefined {
    return this.#get("attributes", typeName, undefined, propertyName);
  }

  public getDefinitionDocs(
    typeName: string,
    definitionName: string,
    propertyName?: string,
  ): TypeDocumentation | undefined {
    return this.#get("definitions", typeName, definitionName, propertyName);
  }

  public getResourceDocs(
    typeName: string,
    propertyName?: string,
  ): TypeDocumentation | undefined {
    return this.#get("properties", typeName, undefined, propertyName);
  }

  #get(
    type: "attributes" | "definitions" | "properties",
    typeName: string,
    definitionName?: string,
    propertyName?: string,
  ): TypeDocumentation | undefined {
    let root: ObjectSupplemental | undefined;

    if (type === "attributes") {
      root = this.#data[typeName]?.attributes;
    } else if (type === "definitions") {
      assert(definitionName);
      root = this.#data[typeName]?.definitions[definitionName];
    } else {
      assert(!definitionName);
      root = this.#data[typeName];
    }

    if (!root) {
      return;
    }

    if (propertyName) {
      const docs = root.properties[propertyName];
      return (
        docs && {
          description: docs.description,
          documentationUrl: docs.documentationUrl,
          wellKnownType: docs.wellKnownType,
        }
      );
    }

    return {
      description: root.description,
      documentationUrl: root.documentationUrl,
    };
  }
}
