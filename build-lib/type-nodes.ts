import assert from "node:assert";
import type { JsonPrimitive, JsonValue } from "../lib/json.ts";

/**
 * An import specification.
 */
export type ImportedName = {
  type: "import";
  exportedName?: string | undefined;
  moduleName: string;
  name: string;
  typeOnly?: boolean | undefined;
};

/**
 * An indexed type name, like `MyType['property']`.
 */
export type IndexedName = {
  type: "indexed";
  name: SymbolName;
  indexes: string[];
};

/**
 * The name of a type reference.
 */
export type SymbolName = string | ImportedName | IndexedName;

export type AnyType = {
  type: "any";
  id: string;
};

export type ArrayType = {
  type: "array";
  id: string;
  items: ItemInfo;
};

export type ConstType = {
  type: "const";
  id: string;
  value: JsonPrimitive;
};

export type EnumType = {
  type: "enum";
  id: string;
  values: JsonPrimitive[];
};

export type ItemInfo = {
  documentation?: TypeDocumentation;
  type: Type;
};

export type ObjectType = {
  type: "object";
  id: string;
  properties: Record<string, PropertyInfo>;
  required: string[];
};

export type PrimitiveType = {
  type: "boolean" | "integer" | "null" | "number" | "string";
  id: string;
};

export type PropertyFlag = "readOnly";

export type PropertyInfo = {
  documentation?: TypeDocumentation | undefined;
  isAttribute?: boolean | undefined;
  readOnly?: boolean | undefined;
  type: Type;
};

export type RecordType = {
  type: "record";
  id: string;
  value: Type;
};

export type ReferenceType = {
  type: "reference";
  id: string;
  name: SymbolName;
};

export type RelationshipRef = {
  propertyPath: string;
  typeName: string;
};

export type ResourceType = {
  typeName: string;
  attributes?: TypeDefinition<ObjectType>;
  definitions: Record<string, TypeDefinition>;
  properties: TypeDefinition;
};

export type TypeDocumentation = {
  $comment?: string | undefined;
  default?: JsonValue | undefined;
  deprecated?: boolean | undefined;
  description?: string | undefined;
  documentationUrl?: string | undefined;
  examples?: JsonValue[] | undefined;
  exclusiveMaximum?: number | undefined;
  exclusiveMinimum?: number | undefined;
  format?: string | string[] | undefined;
  hidden?: boolean | undefined;
  insertionOrder?: boolean | undefined;
  maximum?: number | undefined;
  maxItems?: number | undefined;
  maxLength?: number | undefined;
  maxProperties?: number | undefined;
  minimum?: number | undefined;
  minItems?: number | undefined;
  minLength?: number | undefined;
  minProperties?: number | undefined;
  multipleOf?: number | undefined;
  pattern?: string | string[] | undefined;
  relationshipRef?: RelationshipRef | RelationshipRef[] | undefined;
  title?: string | undefined;
  uniqueItems?: boolean | undefined;
  wellKnownType?: WellKnownType | undefined;
};

export type Type =
  | AnyType
  | ArrayType
  | ConstType
  | EnumType
  | ObjectType
  | PrimitiveType
  | ReferenceType
  | RecordType
  | UnionType
  | UnknownType;

export type TypeDefinition<T extends Type = Type> = {
  documentation?: TypeDocumentation | undefined;
  type: T;
};

export type UnionType = {
  type: "union";
  id: string;
  items: Type[];
};

export type UnknownType = {
  type: "unknown";
  id: string;
};

export type WellKnownType = "iam-policy";

export function isPrimitiveTypeNode(node: Type): node is PrimitiveType {
  return (
    node.type === "boolean" ||
    node.type === "integer" ||
    node.type === "number" ||
    node.type === "string"
  );
}

export function isSameType(a: Type, b: Type): boolean {
  if (a === b) {
    return true;
  }
  if (a.type === "array" && b.type === "array") {
    return isSameType(a.items.type, b.items.type);
  }
  if (a.type === "const" && b.type === "const") {
    return a.value === b.value;
  }
  if (a.type === "enum" && b.type === "enum") {
    return (
      a.values.length === b.values.length &&
      a.values.every((value, i) => b.values[i] === value)
    );
  }
  if (a.type === "object" && b.type === "object") {
    const aProps = Object.entries(a.properties);
    const bProps = Object.entries(b.properties);

    return (
      a.required.length === b.required.length &&
      aProps.length === bProps.length &&
      a.required.every((x, i) => b.required[i] === x) &&
      aProps.every(
        ([name, type], i) =>
          bProps[i] &&
          bProps[i][0] === name &&
          isSameType(type.type, bProps[i][1].type),
      )
    );
  }
  if (a.type === "record" && b.type === "record") {
    return isSameType(a.value, b.value);
  }
  if (a.type === "reference" && b.type === "reference") {
    return a.name === b.name;
  }
  if (a.type === "union" && b.type === "union") {
    return (
      a.items.length === b.items.length &&
      a.items.every((item, i) => b.items[i] && isSameType(item, b.items[i]))
    );
  }
  return a.type === b.type;
}

export function simplifyUnionType(type: UnionType): Type {
  const items: Type[] = [];
  const working = [...type.items];

  while (working.length > 0) {
    const current = working.shift();
    assert(current);

    if (current.type === "union") {
      working.unshift(...current.items);
    } else if (!items.some((x) => isSameType(x, current))) {
      items.push(current);
    }
  }

  if (items.length === 0) {
    return {
      type: "unknown",
      id: type.id,
    };
  }
  if (items.length === 1) {
    assert(items[0]);
    return items[0];
  }
  return { ...type, items };
}
