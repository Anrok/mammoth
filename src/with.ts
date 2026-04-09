import { CollectionToken, GroupToken, SeparatorToken, StringToken, Token } from './tokens';

import { Query } from './query';
import { wrapQuotes } from './naming';
import { FromItem, makeFromItem } from './from-item';

/** @deprecated Import from `./from-item` instead. */
export type { FromItem } from './from-item';
/** @deprecated Import from `./from-item` instead. */
export { makeFromItem } from './from-item';

type QueryFn<T> = Query<any> | ((args: T) => Query<any>);

type NameAndMaterialization = string | [string, { materialized: boolean | null }];
type GetNameFromNameAndMaterialization<NM> = NM extends string
  ? NM
  : NM extends [infer N, any]
    ? N
    : never;

type WithArg<N extends NameAndMaterialization, W> = {
  [K in GetNameFromNameAndMaterialization<N>]: FromItem<W>;
};

export interface WithFn {
  <N1 extends NameAndMaterialization, W1 extends QueryFn<never>, Q extends Query<any>>(
    name1: N1,
    with1: W1,
    callback: (args: WithArg<N1, W1>) => Q,
  ): Q;
  <
    N1 extends NameAndMaterialization,
    W1 extends QueryFn<never>,
    N2 extends NameAndMaterialization,
    W2 extends QueryFn<WithArg<N1, W1>>,
    Q extends Query<any>,
  >(
    name1: N1,
    with1: W1,
    name2: N2,
    with2: W2,
    callback: (args: WithArg<N1, W1> & WithArg<N2, W2>) => Q,
  ): Q;
  <
    N1 extends NameAndMaterialization,
    W1 extends QueryFn<never>,
    N2 extends NameAndMaterialization,
    W2 extends QueryFn<WithArg<N1, W1>>,
    N3 extends NameAndMaterialization,
    W3 extends QueryFn<WithArg<N1, W1> & WithArg<N2, W2>>,
    Q extends Query<any>,
  >(
    name1: N1,
    with1: W1,
    name2: N2,
    with2: W2,
    name3: N3,
    with3: W3,
    callback: (args: WithArg<N1, W1> & WithArg<N2, W2> & WithArg<N3, W3>) => Q,
  ): Q;
  <
    N1 extends NameAndMaterialization,
    W1 extends QueryFn<never>,
    N2 extends NameAndMaterialization,
    W2 extends QueryFn<WithArg<N1, W1>>,
    N3 extends NameAndMaterialization,
    W3 extends QueryFn<WithArg<N1, W1> & WithArg<N2, W2>>,
    N4 extends NameAndMaterialization,
    W4 extends QueryFn<WithArg<N1, W1> & WithArg<N2, W2> & WithArg<N3, W3>>,
    Q extends Query<any>,
  >(
    name1: N1,
    with1: W1,
    name2: N2,
    with2: W2,
    name3: N3,
    with3: W3,
    name4: N4,
    with4: W4,
    callback: (args: WithArg<N1, W1> & WithArg<N2, W2> & WithArg<N3, W3> & WithArg<N4, W4>) => Q,
  ): Q;
  <
    N1 extends NameAndMaterialization,
    W1 extends QueryFn<never>,
    N2 extends NameAndMaterialization,
    W2 extends QueryFn<WithArg<N1, W1>>,
    N3 extends NameAndMaterialization,
    W3 extends QueryFn<WithArg<N1, W1> & WithArg<N2, W2>>,
    N4 extends NameAndMaterialization,
    W4 extends QueryFn<WithArg<N1, W1> & WithArg<N2, W2> & WithArg<N3, W3>>,
    N5 extends NameAndMaterialization,
    W5 extends QueryFn<WithArg<N1, W1> & WithArg<N2, W2> & WithArg<N3, W3> & WithArg<N4, W4>>,
    Q extends Query<any>,
  >(
    name1: N1,
    with1: W1,
    name2: N2,
    with2: W2,
    name3: N3,
    with3: W3,
    name4: N4,
    with4: W4,
    name5: N5,
    with5: W5,
    callback: (
      args: WithArg<N1, W1> & WithArg<N2, W2> & WithArg<N3, W3> & WithArg<N4, W4> & WithArg<N5, W5>,
    ) => Q,
  ): Q;
  <
    N1 extends NameAndMaterialization,
    W1 extends QueryFn<never>,
    N2 extends NameAndMaterialization,
    W2 extends QueryFn<WithArg<N1, W1>>,
    N3 extends NameAndMaterialization,
    W3 extends QueryFn<WithArg<N1, W1> & WithArg<N2, W2>>,
    N4 extends NameAndMaterialization,
    W4 extends QueryFn<WithArg<N1, W1> & WithArg<N2, W2> & WithArg<N3, W3>>,
    N5 extends NameAndMaterialization,
    W5 extends QueryFn<WithArg<N1, W1> & WithArg<N2, W2> & WithArg<N3, W3> & WithArg<N4, W4>>,
    N6 extends NameAndMaterialization,
    W6 extends QueryFn<
      WithArg<N1, W1> & WithArg<N2, W2> & WithArg<N3, W3> & WithArg<N4, W4> & WithArg<N5, W5>
    >,
    Q extends Query<any>,
  >(
    name1: N1,
    with1: W1,
    name2: N2,
    with2: W2,
    name3: N3,
    with3: W3,
    name4: N4,
    with4: W4,
    name5: N5,
    with5: W5,
    name6: N6,
    with6: W6,
    callback: (
      args: WithArg<N1, W1> &
        WithArg<N2, W2> &
        WithArg<N3, W3> &
        WithArg<N4, W4> &
        WithArg<N5, W5> &
        WithArg<N6, W6>,
    ) => Q,
  ): Q;
  <
    N1 extends NameAndMaterialization,
    W1 extends QueryFn<never>,
    N2 extends NameAndMaterialization,
    W2 extends QueryFn<WithArg<N1, W1>>,
    N3 extends NameAndMaterialization,
    W3 extends QueryFn<WithArg<N1, W1> & WithArg<N2, W2>>,
    N4 extends NameAndMaterialization,
    W4 extends QueryFn<WithArg<N1, W1> & WithArg<N2, W2> & WithArg<N3, W3>>,
    N5 extends NameAndMaterialization,
    W5 extends QueryFn<WithArg<N1, W1> & WithArg<N2, W2> & WithArg<N3, W3> & WithArg<N4, W4>>,
    N6 extends NameAndMaterialization,
    W6 extends QueryFn<
      WithArg<N1, W1> & WithArg<N2, W2> & WithArg<N3, W3> & WithArg<N4, W4> & WithArg<N5, W5>
    >,
    N7 extends NameAndMaterialization,
    W7 extends QueryFn<
      WithArg<N1, W1> &
        WithArg<N2, W2> &
        WithArg<N3, W3> &
        WithArg<N4, W4> &
        WithArg<N5, W5> &
        WithArg<N6, W6>
    >,
    Q extends Query<any>,
  >(
    name1: N1,
    with1: W1,
    name2: N2,
    with2: W2,
    name3: N3,
    with3: W3,
    name4: N4,
    with4: W4,
    name5: N5,
    with5: W5,
    name6: N6,
    with6: W6,
    name7: N7,
    with7: W7,
    callback: (
      args: WithArg<N1, W1> &
        WithArg<N2, W2> &
        WithArg<N3, W3> &
        WithArg<N4, W4> &
        WithArg<N5, W5> &
        WithArg<N6, W6> &
        WithArg<N7, W7>,
    ) => Q,
  ): Q;
  <
    N1 extends NameAndMaterialization,
    W1 extends QueryFn<never>,
    N2 extends NameAndMaterialization,
    W2 extends QueryFn<WithArg<N1, W1>>,
    N3 extends NameAndMaterialization,
    W3 extends QueryFn<WithArg<N1, W1> & WithArg<N2, W2>>,
    N4 extends NameAndMaterialization,
    W4 extends QueryFn<WithArg<N1, W1> & WithArg<N2, W2> & WithArg<N3, W3>>,
    N5 extends NameAndMaterialization,
    W5 extends QueryFn<WithArg<N1, W1> & WithArg<N2, W2> & WithArg<N3, W3> & WithArg<N4, W4>>,
    N6 extends NameAndMaterialization,
    W6 extends QueryFn<
      WithArg<N1, W1> & WithArg<N2, W2> & WithArg<N3, W3> & WithArg<N4, W4> & WithArg<N5, W5>
    >,
    N7 extends NameAndMaterialization,
    W7 extends QueryFn<
      WithArg<N1, W1> &
        WithArg<N2, W2> &
        WithArg<N3, W3> &
        WithArg<N4, W4> &
        WithArg<N5, W5> &
        WithArg<N6, W6>
    >,
    N8 extends NameAndMaterialization,
    W8 extends QueryFn<
      WithArg<N1, W1> &
        WithArg<N2, W2> &
        WithArg<N3, W3> &
        WithArg<N4, W4> &
        WithArg<N5, W5> &
        WithArg<N6, W6> &
        WithArg<N7, W7>
    >,
    Q extends Query<any>,
  >(
    name1: N1,
    with1: W1,
    name2: N2,
    with2: W2,
    name3: N3,
    with3: W3,
    name4: N4,
    with4: W4,
    name5: N5,
    with5: W5,
    name6: N6,
    with6: W6,
    name7: N7,
    with7: W7,
    name8: N8,
    with8: W8,
    callback: (
      args: WithArg<N1, W1> &
        WithArg<N2, W2> &
        WithArg<N3, W3> &
        WithArg<N4, W4> &
        WithArg<N5, W5> &
        WithArg<N6, W6> &
        WithArg<N7, W7> &
        WithArg<N8, W8>,
    ) => Q,
  ): Q;
  <
    N1 extends NameAndMaterialization,
    W1 extends QueryFn<never>,
    N2 extends NameAndMaterialization,
    W2 extends QueryFn<WithArg<N1, W1>>,
    N3 extends NameAndMaterialization,
    W3 extends QueryFn<WithArg<N1, W1> & WithArg<N2, W2>>,
    N4 extends NameAndMaterialization,
    W4 extends QueryFn<WithArg<N1, W1> & WithArg<N2, W2> & WithArg<N3, W3>>,
    N5 extends NameAndMaterialization,
    W5 extends QueryFn<WithArg<N1, W1> & WithArg<N2, W2> & WithArg<N3, W3> & WithArg<N4, W4>>,
    N6 extends NameAndMaterialization,
    W6 extends QueryFn<
      WithArg<N1, W1> & WithArg<N2, W2> & WithArg<N3, W3> & WithArg<N4, W4> & WithArg<N5, W5>
    >,
    N7 extends NameAndMaterialization,
    W7 extends QueryFn<
      WithArg<N1, W1> &
        WithArg<N2, W2> &
        WithArg<N3, W3> &
        WithArg<N4, W4> &
        WithArg<N5, W5> &
        WithArg<N6, W6>
    >,
    N8 extends NameAndMaterialization,
    W8 extends QueryFn<
      WithArg<N1, W1> &
        WithArg<N2, W2> &
        WithArg<N3, W3> &
        WithArg<N4, W4> &
        WithArg<N5, W5> &
        WithArg<N6, W6> &
        WithArg<N7, W7>
    >,
    N9 extends NameAndMaterialization,
    W9 extends QueryFn<
      WithArg<N1, W1> &
        WithArg<N2, W2> &
        WithArg<N3, W3> &
        WithArg<N4, W4> &
        WithArg<N5, W5> &
        WithArg<N6, W6> &
        WithArg<N7, W7> &
        WithArg<N8, W8>
    >,
    Q extends Query<any>,
  >(
    name1: N1,
    with1: W1,
    name2: N2,
    with2: W2,
    name3: N3,
    with3: W3,
    name4: N4,
    with4: W4,
    name5: N5,
    with5: W5,
    name6: N6,
    with6: W6,
    name7: N7,
    with7: W7,
    name8: N8,
    with8: W8,
    name9: N9,
    with9: W9,
    callback: (
      args: WithArg<N1, W1> &
        WithArg<N2, W2> &
        WithArg<N3, W3> &
        WithArg<N4, W4> &
        WithArg<N5, W5> &
        WithArg<N6, W6> &
        WithArg<N7, W7> &
        WithArg<N8, W8> &
        WithArg<N9, W9>,
    ) => Q,
  ): Q;
  <
    N1 extends NameAndMaterialization,
    W1 extends QueryFn<never>,
    N2 extends NameAndMaterialization,
    W2 extends QueryFn<WithArg<N1, W1>>,
    N3 extends NameAndMaterialization,
    W3 extends QueryFn<WithArg<N1, W1> & WithArg<N2, W2>>,
    N4 extends NameAndMaterialization,
    W4 extends QueryFn<WithArg<N1, W1> & WithArg<N2, W2> & WithArg<N3, W3>>,
    N5 extends NameAndMaterialization,
    W5 extends QueryFn<WithArg<N1, W1> & WithArg<N2, W2> & WithArg<N3, W3> & WithArg<N4, W4>>,
    N6 extends NameAndMaterialization,
    W6 extends QueryFn<
      WithArg<N1, W1> & WithArg<N2, W2> & WithArg<N3, W3> & WithArg<N4, W4> & WithArg<N5, W5>
    >,
    N7 extends NameAndMaterialization,
    W7 extends QueryFn<
      WithArg<N1, W1> &
        WithArg<N2, W2> &
        WithArg<N3, W3> &
        WithArg<N4, W4> &
        WithArg<N5, W5> &
        WithArg<N6, W6>
    >,
    N8 extends NameAndMaterialization,
    W8 extends QueryFn<
      WithArg<N1, W1> &
        WithArg<N2, W2> &
        WithArg<N3, W3> &
        WithArg<N4, W4> &
        WithArg<N5, W5> &
        WithArg<N6, W6> &
        WithArg<N7, W7>
    >,
    N9 extends NameAndMaterialization,
    W9 extends QueryFn<
      WithArg<N1, W1> &
        WithArg<N2, W2> &
        WithArg<N3, W3> &
        WithArg<N4, W4> &
        WithArg<N5, W5> &
        WithArg<N6, W6> &
        WithArg<N7, W7> &
        WithArg<N8, W8>
    >,
    N10 extends NameAndMaterialization,
    W10 extends QueryFn<
      WithArg<N1, W1> &
        WithArg<N2, W2> &
        WithArg<N3, W3> &
        WithArg<N4, W4> &
        WithArg<N5, W5> &
        WithArg<N6, W6> &
        WithArg<N7, W7> &
        WithArg<N8, W8> &
        WithArg<N9, W9>
    >,
    Q extends Query<any>,
  >(
    name1: N1,
    with1: W1,
    name2: N2,
    with2: W2,
    name3: N3,
    with3: W3,
    name4: N4,
    with4: W4,
    name5: N5,
    with5: W5,
    name6: N6,
    with6: W6,
    name7: N7,
    with7: W7,
    name8: N8,
    with8: W8,
    name9: N9,
    with9: W9,
    name10: N10,
    with10: W10,
    callback: (
      args: WithArg<N1, W1> &
        WithArg<N2, W2> &
        WithArg<N3, W3> &
        WithArg<N4, W4> &
        WithArg<N5, W5> &
        WithArg<N6, W6> &
        WithArg<N7, W7> &
        WithArg<N8, W8> &
        WithArg<N9, W9> &
        WithArg<N10, W10>,
    ) => Q,
  ): Q;
}

export const makeWith =
  (): WithFn =>
  (...args: any[]) => {
    const queries: any = {};

    const createWith = (withFn: QueryFn<any>) => {
      if (withFn instanceof Query) {
        return withFn;
      }

      return withFn(queries);
    };

    const tokens: Token[] = [];

    for (let i = 0; i < args.length - 1; i += 2) {
      const arg: NameAndMaterialization = args[i];
      let name = '';
      let materialized: boolean | null = null;
      if (typeof arg === 'string') {
        name = arg;
      } else {
        name = arg[0];
        materialized = arg[1].materialized ?? null;
      }

      const withQuery = createWith(args[i + 1]);

      const asKeyword = (() => {
        switch (materialized) {
          case true:
            return 'AS MATERIALIZED';
          case false:
            return 'AS NOT MATERIALIZED';
          case null:
            return 'AS';
        }
      })();

      tokens.push(
        new CollectionToken([
          new StringToken(wrapQuotes(name)),
          new StringToken(asKeyword),
          new GroupToken(withQuery.toTokens()),
        ]),
      );

      queries[name] = makeFromItem(name, withQuery);
    }

    const callback = args[args.length - 1];

    const query: Query<any> = callback(queries);

    return query.newQueryWithTokens([
      new StringToken(`WITH`),
      new SeparatorToken(`,`, tokens),
      ...query.toQueryTokens(),
    ]);
  };
