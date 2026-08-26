import {h} from "vue";
import {Button} from "@/components/ui/button";
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-vue-next'
export function createHeaderButton(label: string, columnKey: string,order:string,direction:boolean,onClick:void) {
    return h(
        Button,
        {
            variant: order === columnKey ? "default" : "ghost",
            onClick: () => {
              onClick(columnKey,!direction)
            },
            class: "h-fit text-pretty my-1",
        },
        () => [
            label,
            h(
                order === columnKey
                    ? direction
                        ? ArrowDown
                        : ArrowUp
                    : ChevronsUpDown,
                { class: "ml-1 h-4 w-4" }
            ),
        ]
    );
}