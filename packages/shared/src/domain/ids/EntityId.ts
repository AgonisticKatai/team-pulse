declare const brand: unique symbol

export type EntityId<Brand extends string> = string & {
  readonly [brand]: Brand
}
