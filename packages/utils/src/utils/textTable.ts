export interface TextTableColumn {
    name: string;
    align: "left" | "right";
    minWidth?: number;
}

export interface TextTableData {
    padding: number;
    columns: TextTableColumn[];
    rows: string[][];
}

export const textTable = (data: TextTableData): string => {
    const columnData: TextTableColumn[] = data.columns.map(x => {
        return {
            ...x,
            minWidth: x.minWidth ?? x.name.length,
        }
    });

    for (const [ri, row] of data.rows.entries()) {
        if (row.length !== columnData.length) {
            throw new Error(`Row ${ri} has incorrect number of columns (actual: ${row.length}, expected: ${columnData.length})`)
        }
        for (const [ci, cell] of row.entries()) {
            columnData[ci].minWidth = Math.max(columnData[ci].minWidth, cell.length);
        }
    }

    const parseRow = (columns: string[]): string => {
        let row: string = "";
        for (const [i, column] of columns.entries()) {
            const cData = columnData[i];

            const padding = " ".repeat(cData.minWidth - column.length);
            if (row !== "") {
                row += " ".repeat(data.padding);
            }
            if (cData.align === "left") {
                row += `${column}${padding}`;
            } else {
                row += `${padding}${column}`;
            }
        }
        return row;
    }

    let result = `${parseRow(columnData.map(x => x.name))}\n`;

    result += data.rows
        .map(parseRow)
        .join("\n");

    return result;
}
