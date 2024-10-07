import { Index, IndexDefinition, makeIndexDefinition } from "./table-index";

export function btree(): IndexDefinition<string, boolean, boolean, Record<string, any>> {
    return makeIndexDefinition(`btree`);
}
