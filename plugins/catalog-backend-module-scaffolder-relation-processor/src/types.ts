/**
 * Extension of the `spec` field of the entity model
 * Used to form relations between entities and the scaffolder templates that generated them
 *
 * @public
 */
export type ScaffoldedBySpec = {
  spec: {
    scaffoldedFrom: string;
  };
};
