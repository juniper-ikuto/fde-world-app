declare module "sql.js" {
  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database;
  }

  interface QueryExecResult {
    columns: string[];
    values: (string | number | null | Uint8Array)[][];
  }

  interface Database {
    run(sql: string, params?: (string | number | null)[]): Database;
    exec(sql: string, params?: (string | number | null)[]): QueryExecResult[];
    export(): Uint8Array;
    close(): void;
  }

  interface InitSqlJsOptions {
    locateFile?: (file: string) => string;
  }

  export default function initSqlJs(
    options?: InitSqlJsOptions
  ): Promise<SqlJsStatic>;

  export { Database, SqlJsStatic, QueryExecResult };
}
