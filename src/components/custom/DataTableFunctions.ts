import {h, Ref} from "vue";
import {ColumnDef, createColumnHelper} from "@tanstack/vue-table";
import {
    DropdownMenu,
    DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {Button} from "@/components/ui/button";
import {MoreHorizontal} from "lucide-vue-next";

export interface FieldConfig<T> {
    accessor: keyof T;
    header: string;
    cellClass?: string;
    row?: string | ((item: T) => any);
}


export interface TableAction<T> {
    label: string;
    onClick: (item: T) => void;
    className?: string;

}

export interface TableColumnsConfig<T> {
    fields: FieldConfig<T>[];
    actions?: TableAction<T>[];
    loadingAction?: Ref<boolean>;
    loading?: Ref<boolean>;
}


// export function createTableColumns<T extends { id: string | number }>(
//     config: TableColumnsConfig<T>
// ): ColumnDef<T, any>[] {
//     const columnHelper = createColumnHelper<T>();
//
//     // Cria as colunas para os campos informados na configuração
//     const columns = config.fields.map((field) =>
//         columnHelper.accessor(field.accessor as string, {
//         header: () => field.header,
//         cell: ({ row }) =>
//             h("div", { class: field.cellClass }, field.row
//                 ? typeof field.row === "function"
//                     ? field.row(row.original)
//                     : field.row
//                 : row.getValue(field.accessor)
//             )
//     })
// );
//
//     columns.push(
//         columnHelper.display({
//             id: "actions",
//             header: () => "Ações",
//             cell: ({ row }) =>
//                 h(DropdownMenu, {}, [
//                     h(
//                         DropdownMenuTrigger,
//                         { asChild: true },
//                         h(
//                             Button,
//                             {
//                                 "aria-haspopup": "true",
//                                 size: "icon",
//                                 variant: "ghost",
//                                 disabled: (config.loadingAction && config.loadingAction.value)
//
//                             },
//                             [
//                                 h(MoreHorizontal, { class: "h-4 w-4" }),
//                                 h("span", { class: "sr-only" }, "Ações")
//                             ]
//                         )
//                     ),
//                     h(DropdownMenuContent, { align: "end" }, [
//                         h(DropdownMenuLabel, {}, "Ações"),
//                         h(DropdownMenuSeparator, {}),
//                         // Mapeia as ações passadas na configuração
//                         ...config.actions.map((action, index) =>
//                             h(
//                                 DropdownMenuItem,
//                                 {
//                                     key: index,
//                                     class: action.className,
//                                     onClick: () => action.onClick(row.original)
//                                 },
//                                 action.label
//                             )
//                         )
//                     ])
//                 ])
//         })
//     );
//
//
//     return columns;
// }
