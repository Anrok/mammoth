import { Column, ColumnSet } from './column';

import { Expression } from './expression';
import { SelectQuery } from './select';
import { Star } from './sql-functions';

export type GetSelectableName<S> =
  S extends Column<infer A2, string, any, boolean, boolean, any>
    ? A2
    : S extends Expression<any, boolean, infer A1>
      ? A1
      : S extends SelectQuery<infer Columns>
        ? keyof Columns // This only works if the query has one select clause
        : never;

export type GetSelectable<C extends Selectable> =
  C extends ColumnSet<infer Columns> ? Columns : { [K in GetSelectableName<C>]: C };

export type Selectable =
  | Expression<any, any, any>
  | SelectQuery<any>
  | Column<any, any, any, boolean, boolean, any>
  | ColumnSet<any>
  | Star;

type ContainsStar<Selectables> = Extract<Star, Selectables> extends never ? false : true;

type GetSelectables<Columns extends Array<any>> = {
  [I in keyof Columns]: Columns[I] extends Selectable ? GetSelectable<Columns[I]> : never;
};

// Taken from https://stackoverflow.com/a/51604379/163832
type BoxedTupleTypes<T extends any[]> = { [P in keyof T]: [T[P]] }[Exclude<keyof T, keyof any[]>];
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never;
type UnboxIntersection<T> = T extends { 0: infer U } ? U : never;
type TupleToIntersection<T extends Array<any>> = UnboxIntersection<
  UnionToIntersection<BoxedTupleTypes<T>>
>;
type ToColumns<T> = T extends { [column: string]: any } ? T : never;

export interface SelectFn {
  <Columns extends Array<Selectable>>(
    ...columns: [...Columns]
  ): SelectQuery<
    ToColumns<TupleToIntersection<GetSelectables<Columns>>>,
    ContainsStar<Columns[number]>
  >;
}
