import assert from "node:assert";
import { writeFile } from "node:fs/promises";
import ts from "typescript";
import type { JsonValue } from "../lib/json.ts";
import { asciiCompare } from "./case.ts";
import {
  isPrimitiveTypeNode,
  type AnyType,
  type ArrayType,
  type EnumType,
  type ImportedName,
  type ObjectType,
  type PrimitiveType,
  type PropertyInfo,
  type RecordType,
  type ReferenceType,
  type SymbolName,
  type Type,
  type TypeDefinition,
  type TypeDocumentation,
  type UnionType,
  type UnknownType,
  type WellKnownType,
} from "./type-nodes.ts";

/**
 * A function for determining the order of properties.
 */
export type PropertySortFunction = (
  a: [string, PropertyInfo],
  b: [string, PropertyInfo],
) => number;

/**
 * Object which can simplify the given type.
 */
export type TypeSimplifier = {
  simplifyType: (node: Type) => Type;
};

/**
 * Options to create a {@link CodeGenerator} instance.
 */
export type CodeGeneratorOptions = {
  anyType?: ts.SyntaxKind.AnyKeyword | ts.SyntaxKind.UnknownKeyword | undefined;
  exactOptionalPropertyTypes?: boolean | undefined;
  noDocumentation?: boolean | undefined;
  simplifier?: TypeSimplifier | undefined;
  sortProperties?: PropertySortFunction | false | undefined;
  wellKnownTypes?: Partial<Record<WellKnownType, SymbolName>>;
};

const defaultPropertySort: PropertySortFunction = ([a], [b]) =>
  asciiCompare(a, b);

export class CodeGenerator {
  readonly #anyType: ts.SyntaxKind.AnyKeyword | ts.SyntaxKind.UnknownKeyword;
  readonly #exactOptionalPropertyTypes: boolean;
  readonly #noDocumentation: boolean;
  readonly #referencedNames = new Set<SymbolName>();
  readonly #simplifier: TypeSimplifier | undefined;
  readonly #sortProperties: PropertySortFunction | false;
  readonly #stack: Type[] = [];
  readonly #wellKnownTypes: Partial<Record<WellKnownType, SymbolName>>;

  public get referencedNames(): Set<SymbolName> {
    return this.#referencedNames;
  }

  public constructor(options: CodeGeneratorOptions = {}) {
    this.#anyType = options.anyType ?? ts.SyntaxKind.UnknownKeyword;
    this.#exactOptionalPropertyTypes =
      options.exactOptionalPropertyTypes ?? true;

    this.#noDocumentation = options.noDocumentation ?? false;
    this.#simplifier = options.simplifier;
    this.#sortProperties = options.sortProperties ?? defaultPropertySort;
    this.#wellKnownTypes = options.wellKnownTypes ?? {};
  }

  public createAnyType(): ts.TypeNode {
    return ts.factory.createKeywordTypeNode(this.#anyType);
  }

  public createTypeReference(
    name: SymbolName,
    typeArguments?: ts.TypeNode[],
  ): ts.TypeNode {
    this.#referencedNames.add(name);

    if (typeof name === "string") {
      return ts.factory.createTypeReferenceNode(name, typeArguments);
    }
    if (name.type === "import") {
      return ts.factory.createTypeReferenceNode(name.name, typeArguments);
    }

    assert.strictEqual(name.type, "indexed", "unknown symbol name type");

    const indexes = name.indexes.slice();
    let type: ts.TypeNode = this.createTypeReference(name.name, typeArguments);

    for (const index of indexes) {
      type = ts.factory.createIndexedAccessTypeNode(
        type,
        ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(index)),
      );
    }

    return type;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public generateAnyType(node: AnyType | UnknownType): ts.TypeNode {
    return this.createAnyType();
  }

  public generateArrayType(node: ArrayType): ts.TypeNode {
    return ts.factory.createArrayTypeNode(this.generateType(node.items.type));
  }

  public generateEnumType(node: EnumType): ts.TypeNode {
    return ts.factory.createUnionTypeNode(
      node.values.map((item) => this.generateLiteralType(item)),
    );
  }

  public generateImportDeclarations(imports: ImportedName[]): ts.Statement[] {
    const statements: ts.Statement[] = [];
    const groupedImports = new Map<string, ImportedName[]>();

    for (const item of imports) {
      const existing = groupedImports.get(item.moduleName) ?? [];
      groupedImports.set(item.moduleName, [...existing, item]);
    }

    for (const [moduleName, specs] of groupedImports) {
      const bindings: ts.ImportSpecifier[] = [];
      const allTypeOnly = specs.every((x) => x.typeOnly);

      for (const spec of specs) {
        bindings.push(
          ts.factory.createImportSpecifier(
            !allTypeOnly && spec.typeOnly === true,
            spec.exportedName
              ? ts.factory.createIdentifier(spec.exportedName)
              : undefined,
            ts.factory.createIdentifier(spec.name),
          ),
        );
      }

      statements.push(
        ts.factory.createImportDeclaration(
          undefined,
          ts.factory.createImportClause(
            allTypeOnly,
            undefined,
            ts.factory.createNamedImports(bindings),
          ),
          ts.factory.createStringLiteral(moduleName),
        ),
      );
    }

    return statements;
  }

  public generatePrimitiveType(node: PrimitiveType): ts.TypeNode {
    if (node.type === "boolean") {
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
    }
    if (node.type === "integer") {
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    }
    if (node.type === "number") {
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    }
    if (node.type === "null") {
      return ts.factory.createLiteralTypeNode(ts.factory.createNull());
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    assert(node.type === "string", `unknown primitive type "${node.type}"`);
    return ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
  }

  public generateLiteral(value: JsonValue): ts.LiteralTypeNode["literal"] {
    if (value === null) {
      return ts.factory.createNull();
    }
    if (typeof value === "boolean") {
      return value ? ts.factory.createTrue() : ts.factory.createFalse();
    }
    if (typeof value === "number") {
      return ts.factory.createNumericLiteral(value);
    }
    if (typeof value === "string") {
      return ts.factory.createStringLiteral(value);
    }
    throw new TypeError(`complex types aren't supported for constants`);
  }

  public generateLiteralType(value: JsonValue): ts.TypeNode {
    return ts.factory.createLiteralTypeNode(this.generateLiteral(value));
  }

  public generateObjectType(node: ObjectType): ts.TypeNode {
    const properties: ts.PropertySignature[] = [];
    const propertyEntries = Object.entries(node.properties);

    if (propertyEntries.length === 0) {
      // return Record<string, never> if object has no properties
      return ts.factory.createTypeReferenceNode("Record", [
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword),
      ]);
    }

    if (this.#sortProperties) {
      propertyEntries.sort(this.#sortProperties);
    }

    for (const [name, propertyType] of propertyEntries) {
      const required = !!node.required.includes(name);

      properties.push(
        this.withDocumentation(
          ts.factory.createPropertySignature(
            undefined,
            this.quoteName(name),
            required
              ? undefined
              : ts.factory.createToken(ts.SyntaxKind.QuestionToken),
            this.generateOptionalPropertyType(propertyType, required),
          ),
          this.makePropertyDocumentation(propertyType),
        ),
      );
    }

    return ts.factory.createTypeLiteralNode(properties);
  }

  public generateOptionalPropertyType(
    node: PropertyInfo,
    required: boolean,
  ): ts.TypeNode {
    const wellKnownType = node.documentation?.wellKnownType;

    let type: ts.TypeNode;
    if (wellKnownType && this.#wellKnownTypes[wellKnownType]) {
      const name = this.#wellKnownTypes[wellKnownType];
      type = this.createTypeReference(name);
    } else {
      type = this.generateType(node.type);
    }
    if (
      required ||
      !this.#exactOptionalPropertyTypes ||
      !shouldAddUndefined(type)
    ) {
      return type;
    }
    if (ts.isUnionTypeNode(type)) {
      return ts.factory.createUnionTypeNode(
        type.types.concat([
          ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
        ]),
      );
    }
    return ts.factory.createUnionTypeNode([
      type,
      ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
    ]);
  }

  public generateRecordType(node: RecordType): ts.TypeNode {
    return ts.factory.createTypeReferenceNode("Record", [
      ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
      this.generateType(node.value),
    ]);
  }

  public generateReferenceType(node: ReferenceType): ts.TypeNode {
    return this.createTypeReference(node.name);
  }

  public generateType(node: Type): ts.TypeNode {
    // avoid circular references in case the simplifier is inlining a reference
    if (this.#simplifier && !this.#stack.includes(node)) {
      // eslint-disable-next-line no-param-reassign
      node = this.#simplifier.simplifyType(node);
    }
    this.#stack.push(node);
    try {
      if (isPrimitiveTypeNode(node)) {
        return this.generatePrimitiveType(node);
      }
      if (node.type === "any") {
        return this.generateAnyType(node);
      }
      if (node.type === "array") {
        return this.generateArrayType(node);
      }
      if (node.type === "const") {
        return this.generateLiteralType(node.value);
      }
      if (node.type === "enum") {
        return this.generateEnumType(node);
      }
      if (node.type === "object") {
        return this.generateObjectType(node);
      }
      if (node.type === "record") {
        return this.generateRecordType(node);
      }
      if (node.type === "reference") {
        return this.generateReferenceType(node);
      }
      if (node.type === "unknown") {
        return this.generateAnyType(node);
      }
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (node.type === "union") {
        return this.generateUnionType(node);
      }
      assert(false, `unknown node type "${(node as Type).type}"`);
    } finally {
      assert.strictEqual(this.#stack.pop(), node);
    }
  }

  public generateTypeDefinition(
    name: string,
    definition: TypeDefinition,
  ): ts.Statement {
    return this.withDocumentation(
      ts.factory.createTypeAliasDeclaration(
        [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
        name,
        undefined,
        this.generateType(definition.type),
      ),
      this.makeDefinitionDocumentation(definition),
    );
  }

  public generateUnionType(node: UnionType): ts.TypeNode {
    return ts.factory.createUnionTypeNode(
      node.items.map((item) => this.generateType(item)),
    );
  }

  public makeDefinitionDocumentation(
    node: TypeDefinition,
  ): string[] | undefined {
    return node.documentation && this.makeDocumentation(node.documentation);
  }

  public makeDocumentation(docs: TypeDocumentation): string[] | undefined {
    const lines: string[] = [];

    if (docs.description) {
      lines.push(docs.description);
    }
    if (docs.minimum !== undefined) {
      lines.push(`@min ${docs.minimum}`);
    }
    if (docs.maximum !== undefined) {
      lines.push(`@max ${docs.maximum}`);
    }
    if (docs.minLength !== undefined) {
      lines.push(`@minLength ${docs.minLength}`);
    }
    if (docs.maxLength !== undefined) {
      lines.push(`@maxLength ${docs.maxLength}`);
    }
    if (docs.format !== undefined) {
      if (Array.isArray(docs.format)) {
        lines.push(...docs.format.map((x) => `@format ${x}`));
      } else {
        lines.push(`@format ${docs.format}`);
      }
    }
    if (docs.pattern !== undefined) {
      if (Array.isArray(docs.pattern)) {
        lines.push(...docs.pattern.map((x) => `@pattern ${x}`));
      } else {
        lines.push(`@pattern ${docs.pattern}`);
      }
    }
    if (docs.default !== undefined) {
      lines.push(`@default ${JSON.stringify(docs.default)}`);
    }
    if (docs.examples !== undefined) {
      if (Array.isArray(docs.examples)) {
        lines.push(
          ...docs.examples.map((x) => `@example ${JSON.stringify(x)}`),
        );
      } else {
        lines.push(`@example ${JSON.stringify(docs.examples)}`);
      }
    }
    if (docs.documentationUrl !== undefined) {
      lines.push(`@see {@link ${docs.documentationUrl}}`);
    }
    return lines;
  }

  public makePropertyDocumentation(node: PropertyInfo): string[] | undefined {
    return node.documentation && this.makeDocumentation(node.documentation);
  }

  public quoteName(name: string): ts.Identifier | ts.StringLiteral {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
      return ts.factory.createStringLiteral(name);
    }
    return ts.factory.createIdentifier(name);
  }

  public withDocumentation<T extends ts.Node>(
    node: T,
    documentation?: string | string[],
  ): T {
    if (!documentation?.length || this.#noDocumentation) {
      return node;
    }

    const lines = Array.isArray(documentation)
      ? documentation.flatMap((x) => x.split("\n"))
      : documentation.split("\n");

    // escape the */ sequence to avoid prematurely closing the comment
    const formatted =
      ["*", ...lines].join("\n * ").replaceAll("*/", "*\u200d/") + "\n ";

    return ts.addSyntheticLeadingComment(
      node,
      ts.SyntaxKind.MultiLineCommentTrivia,
      formatted,
      true,
    );
  }
}

/**
 * Output generated code to a file, formatting with Prettier if available.
 */
export async function printSourceFile(
  outputPath: string,
  statements: ts.Statement[],
  skipFormat = false,
): Promise<void> {
  const printer = ts.createPrinter();

  let output = printer.printFile(
    ts.factory.createSourceFile(
      statements,
      ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
      ts.NodeFlags.None,
    ),
  );

  if (!skipFormat) {
    try {
      // optionally format with prettier if available
      const { format } = await import("prettier");
      output = await format(output, {
        filepath: outputPath,
      });
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !("code" in error) ||
        error.code !== "ERR_MODULE_NOT_FOUND"
      ) {
        throw error;
      }
    }
  }

  await writeFile(outputPath, output);
}

/**
 * Returns true if the type doesn't make it pointless to add undefined.
 */
function shouldAddUndefined(node: ts.TypeNode): boolean {
  return (
    node.kind !== ts.SyntaxKind.AnyKeyword &&
    node.kind !== ts.SyntaxKind.UnknownKeyword &&
    node.kind !== ts.SyntaxKind.UndefinedKeyword &&
    (!ts.isUnionTypeNode(node) ||
      node.types.every((x) => shouldAddUndefined(x)))
  );
}
