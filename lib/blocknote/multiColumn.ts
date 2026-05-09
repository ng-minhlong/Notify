import { BlockNoteSchema, combineByGroup } from "@blocknote/core";
import * as locales from "@blocknote/core/locales";
import { getDefaultReactSlashMenuItems } from "@blocknote/react";
import {
    getMultiColumnSlashMenuItems,
    multiColumnDropCursor,
    locales as multiColumnLocales,
    withMultiColumn,
} from "@blocknote/xl-multi-column";

export const createBlockNoteSchema = () => {
    return withMultiColumn(BlockNoteSchema.create());
};
export const applyMultiColumnSchema = (schema: any) => {
    return withMultiColumn(schema);
};
export const createBlockNoteDictionary = () => {
    return {
        ...locales.en,
        multi_column: multiColumnLocales.en,
    };
};

export const createSlashMenuItems = (editor: any, customItems: any[] = []) => {
    return combineByGroup(
        getDefaultReactSlashMenuItems(editor),
        getMultiColumnSlashMenuItems(editor),
        customItems
    );
};

export { multiColumnDropCursor };

