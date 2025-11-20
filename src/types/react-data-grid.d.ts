declare module 'react-data-grid' {
  export type Column<R> = any;
  export type RowsChangeData<R> = {
    indexes: number[];
    column: Column<R>;
    rows: R[];
  };
  export const TextEditor: any;
  const DataGrid: any;
  export default DataGrid;
}

declare module 'react-data-grid/lib/styles.css';



