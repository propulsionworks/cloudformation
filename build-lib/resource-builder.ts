import type {
  PropertySchema,
  ResourceTypeSchema,
} from "@propulsionworks/cfn-resource-schemas";
import assert from "node:assert";
import { posix } from "node:path";
import type { JsonPrimitive } from "../lib/json.ts";
import { ExtraAttributes } from "./extra-attributes.ts";
import {
  assign,
  mergeObjects,
  pick,
  splitPick,
  type MergeObjectsOptions,
} from "./object.ts";
import type { SchemaProblemReporter } from "./problems.ts";
import { getBreadcrumbs } from "./schema-paths.ts";
import {
  isSameType,
  simplifyUnionType,
  type ArrayType,
  type ConstType,
  type EnumType,
  type ItemInfo,
  type ObjectType,
  type PrimitiveType,
  type PropertyInfo,
  type RecordType,
  type ResourceType,
  type Type,
  type TypeDefinition,
  type TypeDocumentation,
} from "./type-nodes.ts";

const IgnorableKeys = ["dependencies"] as const;

type SchemaDocumentationKey = keyof TypeDocumentation & keyof PropertySchema;

const SchemaDocumentationKeys = Object.keys({
  $comment: true,
  default: true,
  description: true,
  examples: true,
  exclusiveMaximum: true,
  exclusiveMinimum: true,
  format: true,
  insertionOrder: true,
  maximum: true,
  maxItems: true,
  maxLength: true,
  maxProperties: true,
  minimum: true,
  minItems: true,
  minLength: true,
  minProperties: true,
  multipleOf: true,
  pattern: true,
  relationshipRef: true,
  title: true,
  uniqueItems: true,
} satisfies Record<SchemaDocumentationKey, true>) as SchemaDocumentationKey[];

type ExtractDocumentationResult = {
  documentation?: TypeDocumentation | undefined;
  type?: PropertySchema | undefined;
};

const RelevantKeys = {
  any: [],
  array: [
    "arrayType",
    "insertionOrder",
    "items",
    "maxItems",
    "maxLength",
    "minItems",
    "minLength",
    "type",
    "uniqueItems",
  ],
  boolean: ["type"],
  const: ["const", "type"],
  enum: ["enum", "type"],
  integer: ["maximum", "minimum", "type"],
  null: ["type"],
  number: ["maximum", "minimum", "type"],
  object: [
    "additionalProperties",
    "anyOf",
    "oneOf",
    "properties",
    "required",
    "type",
  ],
  record: ["additionalProperties", "patternProperties", "type"],
  reference: ["$ref"],
  string: ["format", "maxLength", "minLength", "pattern", "type"],
  union: ["anyOf", "oneOf"],
  unknown: [],
} satisfies Record<Type["type"], (keyof PropertySchema)[]>;

/**
 * Provides documentation for a resource.
 */
export type ResourceDocumenter = {
  getAttributeDocs?: (
    typeName: string,
    propertyName?: string,
  ) => TypeDocumentation | undefined;
  getDefinitionDocs?: (
    typeName: string,
    definitionName: string,
    propertyName?: string,
  ) => TypeDocumentation | undefined;
  getResourceDocs?: (
    typeName: string,
    propertyName?: string,
  ) => TypeDocumentation | undefined;
};

/**
 * Options for creating a {@link ResourceBuilder}.
 */
export type ResourceBuilderOptions = {
  documenter?: ResourceDocumenter | undefined;
  problems?: SchemaProblemReporter | undefined;
};

/**
 * A class which can build a {@link ResourceType} for a
 * {@link ResourceTypeSchema}.
 */
export class ResourceBuilder {
  readonly #documenter: ResourceDocumenter;
  readonly #ignoreExtraKeyLocations = new Set<string>();
  readonly #problems: SchemaProblemReporter | undefined;
  readonly #resourceSchema: ResourceTypeSchema;
  readonly #root: ResourceType;

  public constructor(
    resourceSchema: ResourceTypeSchema,
    options: ResourceBuilderOptions = {},
  ) {
    this.#resourceSchema = resourceSchema;
    this.#documenter = options.documenter ?? {};

    this.#root = {
      typeName: resourceSchema.typeName,
      definitions: {},
      properties: { type: { type: "unknown", id: "/" } },
    };
  }

  /**
   * Build the output for a given resource.
   */
  public build(): ResourceType {
    const rootSchema = pick(this.#resourceSchema, [
      "allOf",
      "anyOf",
      "oneOf",
      "properties",
      "required",
    ]);

    const { type, documentation } = this.#extractDocumentation(rootSchema, "/");
    assert(
      type,
      `expected type to have a value for resource "${this.#resourceSchema.typeName}"`,
    );

    this.#root.properties.documentation = documentation;
    this.#root.properties.type = this.#walkType(type, "/");

    if (this.#resourceSchema.definitions) {
      const definitions = Object.entries(this.#resourceSchema.definitions);
      for (const [definitionName, definition] of definitions) {
        this.#root.definitions[definitionName] = this.#walkDefinition(
          definition,
          `/definitions/${definitionName}`,
        );
      }
    }

    this.#analyzePaths();

    if (this.#root.typeName in ExtraAttributes) {
      const key = this.#root.typeName as keyof typeof ExtraAttributes;
      for (const name of ExtraAttributes[key]) {
        this.#addAttribute(`/properties/${name}`, false);
      }
    }

    return this.#root;
  }

  #addAttribute(path: string, readOnly: boolean): void {
    const props = this.#findProperty(
      path,
      this.#root.typeName.startsWith("AWS::"),
    );

    if (props.length === 0) {
      this.#warn("/readOnlyProperties", "bad reference %O", path);
      return;
    }

    // cfn can't support GetAtt with arrays
    const hasWildcardPath = path.includes("*");

    for (const prop of props) {
      if (!hasWildcardPath && this.#isValidAttributeType(prop.type)) {
        prop.isAttribute = true;
        this.#markChildren(prop.type, "isAttribute", true);
      }

      if (readOnly) {
        prop.readOnly = true;
      }
    }

    const prop = props[0];
    assert(prop);

    if (!props.map((x) => x.type).every((x) => isSameType(prop.type, x))) {
      this.#warn(
        "/readOnlyProperties",
        "attribute has multiple possible types",
        path,
      );
    }

    const documentation = { ...prop.documentation };

    assert(path.startsWith("/properties/"));
    const name = path.slice("/properties/".length).split("/").join(".");

    const extraDocs = this.#documenter.getAttributeDocs?.(
      this.#root.typeName,
      name,
    );
    if (extraDocs) {
      assign(documentation, extraDocs);
    }

    if (!hasWildcardPath && this.#isValidAttributeType(prop.type)) {
      this.#root.attributes ??= {
        documentation: this.#documenter.getAttributeDocs?.(this.#root.typeName),
        type: {
          type: "object",
          id: "/attributes",
          properties: {},
          required: [],
        },
      };
      this.#root.attributes.type.properties[name] = {
        documentation,
        isAttribute: true,
        type: prop.type,
      };
      this.#root.attributes.type.required.push(name);
    }
  }

  #allReadOnlyChildren(node: Type): boolean {
    if (node.type === "array") {
      return this.#allReadOnlyChildren(node.items.type);
    }
    if (node.type === "object") {
      return Object.values(node.properties).every((x) => x.readOnly);
    }
    if (node.type === "reference") {
      if (typeof node.name !== "string") {
        return false;
      }
      const target = this.#root.definitions[node.name];
      assert(target, `unexpected invalid reference name`);
      return this.#allReadOnlyChildren(target.type);
    }
    if (node.type === "union") {
      return node.items.every((item) => this.#allReadOnlyChildren(item));
    }
    return false;
  }

  #anyAttributeChildren(node: Type): boolean {
    if (node.type === "array") {
      return this.#anyAttributeChildren(node.items.type);
    }
    if (node.type === "object") {
      return Object.values(node.properties).some((x) => x.isAttribute);
    }
    if (node.type === "reference") {
      if (typeof node.name !== "string") {
        return false;
      }
      const target = this.#root.definitions[node.name];
      assert(target, `unexpected invalid reference name`);
      return this.#anyAttributeChildren(target.type);
    }
    if (node.type === "union") {
      return node.items.every((item) => this.#anyAttributeChildren(item));
    }
    return false;
  }

  #analyzePaths(): void {
    if (!this.#resourceSchema.readOnlyProperties) {
      return;
    }

    for (const path of this.#resourceSchema.readOnlyProperties) {
      this.#addAttribute(path, true);
    }

    // now we check parent paths to see if they can also be marked readOnly
    const breadcrumbs = getBreadcrumbs(this.#resourceSchema.readOnlyProperties);

    for (const path of breadcrumbs) {
      for (const prop of this.#findProperty(path)) {
        if (this.#allReadOnlyChildren(prop.type)) {
          prop.readOnly = true;
          // now unset readOnly for immediate children,
          // in case the type is used elsewhere
          this.#markChildren(prop.type, "readOnly", false, 1);
        }
        if (this.#anyAttributeChildren(prop.type)) {
          prop.isAttribute = true;
        }
      }
    }
  }

  #extractDocumentation(
    schema: PropertySchema,
    location: string,
  ): ExtractDocumentationResult {
    const [documentation, type] = splitPick(
      this.#mergeAllOf(schema, location),
      SchemaDocumentationKeys,
    );

    if (type.type === "array") {
      // some AWS schemas use the wrong properties for array length
      if (documentation.maxLength !== undefined) {
        documentation.maxItems = documentation.maxLength;
        delete documentation.maxLength;
      }
      if (documentation.minLength !== undefined) {
        documentation.minItems = documentation.minLength;
        delete documentation.minLength;
      }
    }

    const union: TypeDocumentation[] = [];

    if (type.anyOf) {
      const childResults = type.anyOf.map((x) =>
        this.#extractDocumentation(x, location),
      );
      if (!childResults.some((x) => x.type)) {
        union.push(
          ...childResults
            .map((x) => x.documentation)
            .filter((x) => x !== undefined),
        );
        delete type.anyOf;
      }
    }

    if (type.oneOf) {
      const childResults = type.oneOf.map((x) =>
        this.#extractDocumentation(x, location),
      );
      if (!childResults.some((x) => x.type)) {
        union.push(
          ...childResults
            .map((x) => x.documentation)
            .filter((x) => x !== undefined),
        );
        delete type.oneOf;
      }
    }

    const mergedDocs = this.#mergeSchemas<TypeDocumentation>(
      [documentation, ...union],
      {
        mergeArrayValues: ["examples", "format", "pattern", "relationshipRef"],
      },
      location,
    );

    const { definitionName, propertyName } = parsePath(location);

    let extraDocs: TypeDocumentation | undefined;
    if (definitionName) {
      extraDocs = this.#documenter.getDefinitionDocs?.(
        this.#resourceSchema.typeName,
        definitionName,
        propertyName,
      );
    } else if (location === "/" || propertyName) {
      extraDocs = this.#documenter.getResourceDocs?.(
        this.#resourceSchema.typeName,
        propertyName,
      );
    }

    if (extraDocs) {
      assign(mergedDocs, extraDocs);
    }

    return {
      documentation:
        Object.keys(mergedDocs).length > 0 ? mergedDocs : undefined,
      type: Object.keys(type).length > 0 ? type : undefined,
    };
  }

  #findProperty(path: string, mangle?: boolean, root?: Type): PropertyInfo[] {
    let node: Type;
    let parts: string[];

    if (root) {
      node = root;
      parts = path.split("/");
    } else if (path.startsWith("/properties/")) {
      node = this.#root.properties.type;
      parts = path.slice("/properties/".length).split("/");
    } else {
      return [];
    }

    for (let i = 0; i < parts.length; ++i) {
      const part = parts[i];
      assert(part);

      while (node.type === "reference" && typeof node.name === "string") {
        const target = this.#root.definitions[node.name];
        assert(target, `unexpected definition not found`);
        node = target.type;
      }
      if (node.type === "union") {
        // for unions we follow all the child paths and combine the results
        const results = node.items.flatMap((item) =>
          this.#findProperty(parts.slice(i).join("/"), mangle, item),
        );
        return [...results];
      }
      if (part === "*") {
        if (node.type !== "array") {
          return [];
        }
        node = node.items.type;
      } else if (node.type === "object") {
        let prop = node.properties[part];

        // some AWS schemas have dot-separated paths that map to a property without dots
        // see https://github.com/cdklabs/awscdk-service-spec/blob/b4f07742a0b5541d16269776434af1dbf7fff381/packages/@aws-cdk/service-spec-importers/src/resource-builder.ts#L222-L231
        if (mangle && !prop) {
          const mangledName = part.replaceAll(".", "");
          prop = node.properties[mangledName];
          if (prop) {
            node.properties[part] = prop;
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete node.properties[mangledName];
          }
        }
        if (!prop) {
          return [];
        }
        if (i === parts.length - 1) {
          return [prop];
        }
        node = prop.type;
      } else {
        return [];
      }
    }

    return [];
  }

  #isValidAttributeType(type: Type): boolean {
    if (type.type === "array") {
      return this.#isValidAttributeType(type.items.type);
    }
    if (type.type === "reference") {
      const name = type.name;
      if (typeof name !== "string" || !this.#root.definitions[name]) {
        return false;
      }
      const target = this.#root.definitions[name];
      return this.#isValidAttributeType(target.type);
    }
    if (type.type === "union") {
      return type.items.every((x) => this.#isValidAttributeType(x));
    }
    return type.type !== "object" && type.type !== "record";
  }

  #markChildren(
    type: Type,
    flag: "isAttribute" | "readOnly",
    value: boolean,
    maxDepth?: number,
    depth = 1,
    stack: Type[] = [],
  ): void {
    // circular ref protection
    if (stack.includes(type)) {
      return;
    }
    if (type.type === "object") {
      for (const property of Object.values(type.properties)) {
        property[flag] = value;

        if (maxDepth === undefined || depth < maxDepth) {
          this.#markChildren(property.type, flag, value, maxDepth, depth + 1, [
            ...stack,
            type,
          ]);
        }
      }
    } else if (type.type === "array") {
      this.#markChildren(type.items.type, flag, value, maxDepth, depth, [
        ...stack,
        type,
      ]);
    } else if (type.type === "record") {
      this.#markChildren(type.value, flag, value, maxDepth, depth, [
        ...stack,
        type,
      ]);
    } else if (type.type === "reference") {
      const def =
        typeof type.name === "string" && this.#root.definitions[type.name];
      if (def) {
        this.#markChildren(def.type, flag, value, maxDepth, depth, [
          ...stack,
          type,
        ]);
      }
    } else if (type.type === "union") {
      for (const item of type.items) {
        this.#markChildren(item, flag, value, maxDepth, depth, [
          ...stack,
          type,
        ]);
      }
    }
  }

  #mergeAllOf(schema: PropertySchema, location: string): PropertySchema {
    if (schema.allOf !== undefined) {
      const { allOf, ...rest } = schema;
      return this.#mergeSchemas(
        [rest, ...allOf],
        { mergeArrayValues: ["required"], uniqueArrayValues: true },
        location,
      );
    }
    return schema;
  }

  #mergeSchemas<T extends object>(
    objects: T[],
    options: MergeObjectsOptions<T>,
    location: string,
  ): T {
    const { conflicts, value } = mergeObjects(objects, options);
    if (conflicts?.length) {
      this.#warn(
        location,
        `found conflicts while merging schemas for keys`,
        conflicts,
      );
    }
    return value;
  }

  /**
   * Process an array type.
   */
  #walkArrayType(schema: PropertySchema, location: string): ArrayType {
    assert(schema.type === "array", "expected array schema");

    this.#warnExtraKeys(schema, "array", location);
    const itemsLocation = posix.join(location, "items");

    let items: ItemInfo;
    if (schema.items) {
      const { type = {}, documentation = {} } = this.#extractDocumentation(
        schema.items,
        itemsLocation,
      );
      items = {
        type: this.#walkType(type, itemsLocation),
        documentation,
      };
    } else {
      items = {
        type: {
          type: "any",
          id: itemsLocation,
        },
      };
    }

    return {
      type: "array",
      id: location,
      items,
    };
  }

  /**
   * Process a boolean type.
   */
  #walkBooleanType(schema: PropertySchema, location: string): PrimitiveType {
    assert(schema.type === "boolean", "expected boolean schema");
    this.#warnExtraKeys(schema, "boolean", location);

    return {
      type: "boolean",
      id: location,
    };
  }

  /**
   * Process a const type.
   */
  #walkConstType(schema: PropertySchema, location: string): ConstType {
    assert(
      isJsonPrimitive(schema.const),
      "expected const schema with primitive value",
    );
    this.#warnExtraKeys(schema, "const", location);

    return {
      type: "const",
      id: location,
      value: schema.const,
    };
  }

  /**
   * Process a type definition.
   */
  #walkDefinition(schema: PropertySchema, location: string): TypeDefinition {
    const { type = {}, documentation = {} } = this.#extractDocumentation(
      schema,
      location,
    );

    return {
      documentation,
      type: this.#walkType(type, location),
    };
  }

  /**
   * Process an enum type.
   */
  #walkEnumType(schema: PropertySchema, location: string): EnumType {
    assert(
      schema.enum?.every(isJsonPrimitive),
      "expected enum schema with primitive values",
    );
    this.#warnExtraKeys(schema, "enum", location);

    return {
      type: "enum",
      id: location,
      values: schema.enum,
    };
  }

  /**
   * Process a schema with an array value for the type field.
   */
  #walkMultiType(schema: PropertySchema, location: string): Type {
    assert(
      Array.isArray(schema.type) && schema.type.length > 0,
      "expected a non-empty array for type",
    );

    if (schema.type.length === 1) {
      return this.#walkType({ ...schema, type: schema.type[0] }, location);
    }

    // don't report extra keys for this location
    this.#ignoreExtraKeyLocations.add(location);

    const items = schema.type.map((type) =>
      this.#walkType({ ...schema, type }, location),
    );

    // resume reporting extra keys then warn about anything not covered by types
    this.#ignoreExtraKeyLocations.delete(location);

    this.#warnExtraKeys(
      schema,
      items.map((x) => x.type),
      location,
    );

    return simplifyUnionType({
      type: "union",
      id: location,
      items,
    });
  }

  /**
   * Process a null type.
   */
  #walkNullType(schema: PropertySchema, location: string): PrimitiveType {
    assert(schema.type === "null", "expected null schema");
    this.#warnExtraKeys(schema, "null", location);

    return {
      type: "null",
      id: location,
    };
  }

  /**
   * Process a number type.
   */
  #walkNumberType(schema: PropertySchema, location: string): PrimitiveType {
    assert(
      schema.type === "integer" || schema.type === "number",
      "expected integer or number schema",
    );
    this.#warnExtraKeys(schema, schema.type, location);

    return {
      type: schema.type,
      id: location,
    };
  }

  /**
   * Process an object schema.
   */
  #walkObjectType(schema: PropertySchema, location: string): Type {
    assert(
      schema.type === undefined || schema.type === "object",
      "expected object schema",
    );

    if (schema.allOf) {
      return this.#walkObjectType(this.#mergeAllOf(schema, location), location);
    }
    if (schema.anyOf !== undefined) {
      const { anyOf, ...rest } = schema;
      return simplifyUnionType({
        type: "union",
        id: location,
        items: anyOf.map((item) =>
          this.#walkObjectType(
            this.#mergeSchemas(
              [rest, item],
              { mergeArrayValues: ["required"], uniqueArrayValues: true },
              location,
            ),
            location,
          ),
        ),
      });
    }
    if (schema.oneOf !== undefined) {
      const { oneOf, ...rest } = schema;
      return simplifyUnionType({
        type: "union",
        id: location,
        items: oneOf.map((item) =>
          this.#walkObjectType(
            this.#mergeSchemas(
              [rest, item],
              { mergeArrayValues: ["required"], uniqueArrayValues: true },
              location,
            ),
            location,
          ),
        ),
      });
    }

    if (!schema.properties) {
      return this.#walkRecordType(schema, location);
    }

    this.#warnExtraKeys(schema, "object", location);

    const objectType: ObjectType = {
      type: "object",
      id: location,
      properties: {},
      required: schema.required ?? [],
    };

    const properties = Object.entries(schema.properties);

    for (const [propertyName, propertySchema] of properties) {
      objectType.properties[propertyName] = this.#walkProperty(
        propertySchema,
        posix.join(location, "properties", propertyName),
      );
    }

    return objectType;
  }

  /**
   * Process an object property.
   */
  #walkProperty(
    propertySchema: PropertySchema,
    location: string,
  ): PropertyInfo {
    const { documentation = {}, type = {} } = this.#extractDocumentation(
      propertySchema,
      location,
    );

    return {
      documentation,
      type: this.#walkType(type, location),
    };
  }

  /**
   * Process a record schema.
   */
  #walkRecordType(schema: PropertySchema, location: string): RecordType {
    assert(isRecordSchema(schema), "expected record type");
    this.#warnExtraKeys(schema, "record", location);

    assert(!schema.additionalProperties, "unexpected additionalProperties");
    const propLocation = posix.join(location, "patternProperties");

    if (!schema.patternProperties) {
      return {
        type: "record",
        id: location,
        value: {
          type: "any",
          id: propLocation,
        },
      };
    }

    const properties = Object.entries(schema.patternProperties);
    const types: Type[] = [];

    for (const [pattern, patternSchema] of properties) {
      types.push(
        this.#walkType(
          patternSchema,
          posix.join(propLocation, encodeURIComponent(pattern)),
        ),
      );
    }

    return {
      type: "record",
      id: location,
      value: simplifyUnionType({
        type: "union",
        id: propLocation,
        items: types,
      }),
    };
  }

  /**
   * Process a ref schema.
   */
  #walkRefType(schema: PropertySchema, location: string): Type {
    assert(schema.$ref, `expected a ref schema`);
    this.#warnExtraKeys(schema, "reference", location);

    const match = /^#\/definitions\/([^/]+)$/.exec(schema.$ref);
    if (match) {
      const name = match[1];
      assert(name);

      return {
        type: "reference",
        id: location,
        name,
      };
    }

    // this points to something other than a definition, try resolve it
    if (!schema.$ref.startsWith("#/")) {
      this.#warn(location, "invalid reference", schema.$ref);
      return { type: "unknown", id: location };
    }

    let resolved: Record<string, unknown> = this.#resourceSchema;

    for (const part of schema.$ref.slice(2).split("/")) {
      if (part in resolved) {
        resolved = resolved[part] as Record<string, unknown>;
      } else {
        this.#warn(location, "invalid reference", schema.$ref);
        return { type: "unknown", id: location };
      }
    }

    // we'll carry on as if we had the schema here in-line
    return this.#walkType(resolved, schema.$ref.slice(1));
  }

  /**
   * Process a string schema.
   */
  #walkStringType(schema: PropertySchema, location: string): PrimitiveType {
    assert(
      schema.type === "string" || schema.type === undefined,
      "expected a string schema",
    );

    this.#warnExtraKeys(schema, "string", location);

    return {
      type: "string",
      id: location,
    };
  }

  /**
   * Process any schema.
   */
  #walkType(schema: PropertySchema, location: string): Type {
    if (Object.keys(schema).length === 0) {
      return { type: "any", id: location };
    }
    // the next two checks find anyOf/oneOf schemas that have the "type"
    // specified in the root and in each of the sub-schemas. In this case we can
    // ignore the root type and process it as a normal union
    if (schema.anyOf !== undefined && Object.keys(schema).length === 2) {
      if (schema.type && schema.anyOf.every((x) => x.type === schema.type)) {
        const { type, ...rest } = schema;
        return this.#walkType(rest, location);
      }
    }
    if (schema.oneOf !== undefined && Object.keys(schema).length === 2) {
      if (schema.type && schema.oneOf.every((x) => x.type === schema.type)) {
        const { type, ...rest } = schema;
        return this.#walkType(rest, location);
      }
    }
    if (schema.$ref !== undefined) {
      return this.#walkRefType(schema, location);
    }
    if (schema.const !== undefined) {
      return this.#walkConstType(schema, location);
    }
    if (schema.enum !== undefined) {
      return this.#walkEnumType(schema, location);
    }
    if (schema.type === "array") {
      return this.#walkArrayType(schema, location);
    }
    if (Array.isArray(schema.type)) {
      return this.#walkMultiType(schema, location);
    }
    if (schema.type === "boolean") {
      return this.#walkBooleanType(schema, location);
    }
    if (schema.type === "integer" || schema.type === "number") {
      return this.#walkNumberType(schema, location);
    }
    if (schema.type === "null") {
      return this.#walkNullType(schema, location);
    }
    if (isStringSchema(schema)) {
      return this.#walkStringType(schema, location);
    }
    if (isObjectSchema(schema) || isRecordSchema(schema)) {
      return this.#walkObjectType(schema, location);
    }
    if (schema.anyOf !== undefined || schema.oneOf !== undefined) {
      return this.#walkUnion(schema, location);
    }
    this.#warn(location, "unknown schema type", schema);
    return { type: "unknown", id: location };
  }

  /**
   * Process an anyOf/oneOf schema.
   */
  #walkUnion(schema: PropertySchema, location: string): Type {
    this.#warnExtraKeys(schema, "union", location);

    const items: Type[] = [];
    if (schema.anyOf) {
      items.push(
        ...schema.anyOf.map((schema, i) =>
          this.#walkType(schema, posix.join(location, "anyOf", `${i}`)),
        ),
      );
    }
    if (schema.oneOf) {
      items.push(
        ...schema.oneOf.map((schema, i) =>
          this.#walkType(schema, posix.join(location, "oneOf", `${i}`)),
        ),
      );
    }

    if (items.length === 1) {
      const first = items[0];
      assert(first);
      return first;
    }

    return simplifyUnionType({
      type: "union",
      id: location,
      items,
    });
  }

  /**
   * Print a warning about something we found in a schema.
   */
  #warn(location: string, format: string, ...args: unknown[]): void {
    const fullRef = this.#resourceSchema.typeName + location;
    this.#problems?.warn(fullRef, format, ...args);
  }

  /**
   * Check the schema for extra keys and warn if we find some.
   */
  #warnExtraKeys(
    schema: PropertySchema,
    type: Type["type"] | Type["type"][],
    location: string,
  ): void {
    if (this.#ignoreExtraKeyLocations.has(location)) {
      return;
    }

    const allowed: string[] = Array.isArray(type)
      ? type.flatMap((t) => RelevantKeys[t])
      : RelevantKeys[type];

    allowed.push(...IgnorableKeys);
    allowed.push(...SchemaDocumentationKeys);

    if (type === "reference") {
      // some AWS schemas have a spurious "type" field for refs
      allowed.push("type");
    }
    if (schema.additionalProperties === false) {
      // some AWS schemas have a spurious "additionalProperties" field in
      // various places, but it doesn't do anything so we can ignore it
      allowed.push("additionalProperties");
    }
    if (type === "record" && schema.required?.length === 0) {
      // some AWS schemas have a "required" field on record types
      // i.e. object types with "additionalProperties"
      allowed.push("required");
    }

    const extraKeys = Object.keys(schema).filter((x) => !allowed.includes(x));

    if (extraKeys.length > 0) {
      this.#warn(
        location,
        "ignored extra keys %O for type %O",
        extraKeys,
        type,
        schema,
      );
    }
  }
}

function isObjectSchema(schema: PropertySchema): boolean {
  return (
    (schema.type === "object" || schema.type === undefined) &&
    schema.properties !== undefined
  );
}

function isJsonPrimitive(value: unknown): value is JsonPrimitive {
  return (
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "string" ||
    value === null
  );
}

function isRecordSchema(schema: PropertySchema): boolean {
  return (
    (schema.type === "object" && schema.properties === undefined) ||
    (schema.type === undefined && schema.patternProperties !== undefined)
  );
}

function isStringSchema(schema: PropertySchema): boolean {
  return (
    schema.type === "string" ||
    (schema.type === undefined &&
      (schema.format !== undefined || schema.pattern !== undefined))
  );
}

type ParsePathResult = {
  definitionName?: string | undefined;
  propertyName?: string | undefined;
};

function parsePath(path: string): ParsePathResult {
  const regexp =
    /^(?:\/definitions\/(?<definitionName>[^/]+)(?:\/(?:allOf|anyOf|oneOf)\/\d+)*)?(?:\/properties\/(?<propertyName>[^/]+))?$/;
  const match = regexp.exec(path);

  return {
    definitionName: match?.groups?.["definitionName"],
    propertyName: match?.groups?.["propertyName"],
  };
}
