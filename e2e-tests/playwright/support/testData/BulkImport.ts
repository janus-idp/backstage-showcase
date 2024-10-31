export const defaultCatalogInfoYaml = (
  componentName: string,
  project_slug: string,
  user: string,
) => `apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: ${componentName}
  annotations:
    github.com/project-slug: ${project_slug}
spec:
  type: other
  lifecycle: unknown
  owner: user:default/${user}
`;

export const updatedCatalogInfoYaml = (
  componentName: string,
  project_slug: string,
  labels: string,
  user: string,
) => `apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: ${componentName}
  annotations:
    github.com/project-slug: ${project_slug}
  labels:
    ${labels.split(";")[0]}
    ${labels.split(";")[1]}
spec:
  type: other
  lifecycle: unknown
  owner: user:default/${user}
`;
