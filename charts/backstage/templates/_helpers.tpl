{{/*
Expand the name of the chart.
*/}}
{{- define "backstage.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "backstage.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s" .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "backstage.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "backstage.labels" -}}
helm.sh/chart: {{ include "backstage.chart" . }}
{{ include "backstage.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "backstage.selectorLabels" -}}
app.kubernetes.io/name: {{ include "backstage.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Postgresql Common labels
*/}}
{{- define "backstage.postgresql.labels" -}}
helm.sh/chart: {{ include "backstage.chart" . }}
{{ include "backstage.postgresql.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Postresql Selector labels
*/}}
{{- define "backstage.postgresql.selectorLabels" -}}
app.kubernetes.io/name: {{ include "backstage.name" . }}-{{ .Values.postgres.database_name }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "backstage.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "backstage.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "backstage.postgres.serviceAccountName" -}}
{{- if .Values.postgres.serviceAccount.create }}
{{- default (include "backstage.postgresql.name" .) .Values.postgres.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.postgres.serviceAccount.name }}
{{- end }}
{{- end }}


{{/*
Check for existing secret
*/}}
{{- define "gen.postgres-password" -}}
{{- if .Values.postgres.database_password }}
databasePassword: {{ .Values.postgres.database_password | quote }}
{{- else -}}
{{- $secret := lookup "v1" "Secret" .Release.Namespace  (include "backstage.postgresql.name" . ) -}}
{{- if $secret -}}
{{/*
   Reusing existing secret data
databasePassword: {{ $secret.data.databasePassword | quote }}
*/}}
databasePassword: {{ $secret.data.databasePassword | b64dec | quote }}
{{- else -}}
{{/*
    Generate new data
*/}}
databasePassword: "{{ randAlphaNum 20 }}"
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Return the Postgres Database hostname
*/}}
{{- define "backstage.postgresql.host" -}}
{{- if .Values.postgres.database_host }}
{{- .Values.postgres.database_host }}
{{- else -}}
{{- include "backstage.postgresql.name" . }}.{{ .Release.Namespace }}.svc
{{- end -}}
{{- end -}}

{{/*
Check for existing secret
*/}}
{{- define "backstage.postgresql.adminSecretKey" }}
{{- if .Values.postgres.existingSecret }}
name: {{ .Values.postgres.existingSecret }}
key: {{ .Values.postgres.secretKeys.adminPasswordKey }}
{{- else }}
name: {{ include "backstage.postgresql.name" . }}
key: databasePassword
{{- end }}
{{- end }}

{{/*
Expand the name of the chart.
*/}}
{{- define "backstage.host" -}}
{{- default .Values.backstage.baseUrl | trimPrefix "https://" | trimPrefix "http://" }}
{{- end }}

{{/*
Create the image path for the passed in image field
*/}}
{{- define "backstage.image" -}}
{{- if eq (substr 0 7 .version) "sha256:" -}}
{{- printf "%s/%s@%s" .registry .repository .version -}}
{{- else -}}
{{- printf "%s/%s:%s" .registry .repository .version -}}
{{- end -}}
{{- end -}}

{{/*
Create the postgresql name
*/}}
{{- define "backstage.postgresql.name" -}}
{{- printf "%s-postgresql" (include "backstage.fullname" . ) }}
{{- end }}

{{/*
Create the backstage config name
*/}}
{{- define "backstage.config.name" -}}
{{- printf "%s-config" (include "backstage.fullname" . ) }}
{{- end }}
