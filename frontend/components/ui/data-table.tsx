"use client"

import {
    ColumnDef,
    flexRender,
    Table as ReactTable
} from "@tanstack/react-table"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
    table: ReactTable<TData>,
    columns: ColumnDef<TData, TValue>[],
    data: TData[],
    onRowClick?: (row: TData) => void
}

export function DataTable<TData, TValue>({
    table,
    columns,
    data,
    onRowClick
}: DataTableProps<TData, TValue>) {
    return (
        <div className="my-[20px]">
            <Table className="border border-gray-300 dark:border-slate-500">
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id} className="border border-l-0 border-r-0 border-gray-300 dark:border-slate-500">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                onClick={() => onRowClick?.(row.original)}
                                data-state={row.getIsSelected() && "selected"}
                                className="border cursor-pointer border-gray-300 dark:border-slate-500"
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length}
                                className="h-24 text-center"
                            >
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}