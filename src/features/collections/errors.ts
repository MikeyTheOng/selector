export class DuplicateItemError extends Error {
  constructor(public readonly collectionName?: string) {
    super("Item already exists in collection");
    this.name = "DuplicateItemError";
  }
}
