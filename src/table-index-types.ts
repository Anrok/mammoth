import { Expression } from "./expression";
import { IndexDefinition, makeIndexDefinition } from "./table-index";

export function btree(
    ...expressions: Expression<any, boolean, string>[]
): IndexDefinition {
    return makeIndexDefinition(`btree`, expressions);
}

export function gist(
    ...expressions: Expression<any, boolean, string>[]
): IndexDefinition {
    return makeIndexDefinition(`gist`, expressions);
}

export function gin(
    ...expressions: Expression<any, boolean, string>[]
): IndexDefinition {
    return makeIndexDefinition(`gin`, expressions);
}
