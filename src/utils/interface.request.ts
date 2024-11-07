export interface ExecuteReqBody {
  evaluate: {
    overwrite?: boolean;
  };
  timestampShift: {
    removePacs002?: boolean;
  };
}
