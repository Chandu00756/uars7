{{/*
Expand the name of the chart.
*/}}
{{- define "adcf.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "adcf.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "adcf.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "adcf.labels" -}}
helm.sh/chart: {{ include "adcf.chart" . }}
{{ include "adcf.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/component: adcf
app.kubernetes.io/part-of: uars-platform
uars.platform/tier: core
uars.platform/classification: restricted
{{- end }}

{{/*
Selector labels
*/}}
{{- define "adcf.selectorLabels" -}}
app.kubernetes.io/name: {{ include "adcf.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "adcf.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "adcf.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Generate the image name
*/}}
{{- define "adcf.image" -}}
{{- if .Values.image.digest }}
{{- printf "%s/%s@%s" .Values.global.imageRegistry .Values.image.repository .Values.image.digest }}
{{- else }}
{{- printf "%s/%s:%s" .Values.global.imageRegistry .Values.image.repository (.Values.image.tag | default .Chart.AppVersion) }}
{{- end }}
{{- end }}

{{/*
Generate database connection string
*/}}
{{- define "adcf.databaseUrl" -}}
{{- printf "postgres://%s:%s@%s:%d/%s?sslmode=%s" 
    .Values.database.external.username 
    .Values.database.external.password 
    .Values.database.external.host 
    .Values.database.external.port 
    .Values.database.external.database 
    "require" }}
{{- end }}

{{/*
Generate resource limits and requests
*/}}
{{- define "adcf.resources" -}}
{{- if .Values.resources }}
resources:
  {{- if .Values.resources.limits }}
  limits:
    {{- range $key, $value := .Values.resources.limits }}
    {{ $key }}: {{ $value }}
    {{- end }}
  {{- end }}
  {{- if .Values.resources.requests }}
  requests:
    {{- range $key, $value := .Values.resources.requests }}
    {{ $key }}: {{ $value }}
    {{- end }}
  {{- end }}
{{- end }}
{{- end }}

{{/*
Generate security context
*/}}
{{- define "adcf.securityContext" -}}
securityContext:
  runAsNonRoot: true
  runAsUser: {{ .Values.global.securityContext.runAsUser | default 10001 }}
  runAsGroup: {{ .Values.global.securityContext.runAsGroup | default 10001 }}
  fsGroup: {{ .Values.global.securityContext.fsGroup | default 10001 }}
  allowPrivilegeEscalation: false
  capabilities:
    drop:
      - ALL
  readOnlyRootFilesystem: true
  seccompProfile:
    type: RuntimeDefault
{{- end }}

{{/*
Generate pod security context
*/}}
{{- define "adcf.podSecurityContext" -}}
securityContext:
  {{- toYaml .Values.pod.securityContext | nindent 2 }}
{{- end }}

{{/*
Generate environment variables
*/}}
{{- define "adcf.env" -}}
env:
  {{- range .Values.env }}
  - name: {{ .name }}
    {{- if .value }}
    value: {{ .value | quote }}
    {{- else if .valueFrom }}
    valueFrom:
      {{- toYaml .valueFrom | nindent 6 }}
    {{- end }}
  {{- end }}
  # Runtime environment variables
  - name: POD_NAME
    valueFrom:
      fieldRef:
        fieldPath: metadata.name
  - name: POD_NAMESPACE
    valueFrom:
      fieldRef:
        fieldPath: metadata.namespace
  - name: POD_IP
    valueFrom:
      fieldRef:
        fieldPath: status.podIP
  - name: NODE_NAME
    valueFrom:
      fieldRef:
        fieldPath: spec.nodeName
  - name: CLUSTER_NAME
    value: {{ .Values.global.clusterName | default "uars-cluster" | quote }}
  - name: DEPLOYMENT_VERSION
    value: {{ .Chart.AppVersion | quote }}
{{- end }}

{{/*
Generate volume mounts
*/}}
{{- define "adcf.volumeMounts" -}}
volumeMounts:
  {{- with .Values.volumeMounts }}
  {{- toYaml . | nindent 2 }}
  {{- end }}
  # Security volume mounts
  - name: proc
    mountPath: /proc
    readOnly: true
  - name: sys
    mountPath: /sys
    readOnly: true
{{- end }}

{{/*
Generate volumes
*/}}
{{- define "adcf.volumes" -}}
volumes:
  {{- with .Values.volumes }}
  {{- toYaml . | nindent 2 }}
  {{- end }}
  # Security volumes
  - name: proc
    hostPath:
      path: /proc
      type: Directory
  - name: sys
    hostPath:
      path: /sys
      type: Directory
{{- end }}

{{/*
Generate probe configuration
*/}}
{{- define "adcf.livenessProbe" -}}
{{- if .Values.livenessProbe }}
livenessProbe:
  {{- toYaml .Values.livenessProbe | nindent 2 }}
{{- end }}
{{- end }}

{{- define "adcf.readinessProbe" -}}
{{- if .Values.readinessProbe }}
readinessProbe:
  {{- toYaml .Values.readinessProbe | nindent 2 }}
{{- end }}
{{- end }}

{{- define "adcf.startupProbe" -}}
{{- if .Values.startupProbe }}
startupProbe:
  {{- toYaml .Values.startupProbe | nindent 2 }}
{{- end }}
{{- end }}

{{/*
Generate monitoring labels
*/}}
{{- define "adcf.monitoringLabels" -}}
{{- if .Values.monitoring.enabled }}
prometheus.io/scrape: "true"
prometheus.io/port: "9090"
prometheus.io/path: "/metrics"
{{- end }}
{{- end }}

{{/*
Generate network policy selectors
*/}}
{{- define "adcf.networkPolicySelectors" -}}
{{- if .Values.security.networkPolicy.enabled }}
podSelector:
  matchLabels:
    {{- include "adcf.selectorLabels" . | nindent 4 }}
{{- end }}
{{- end }}

{{/*
Generate RBAC labels
*/}}
{{- define "adcf.rbacLabels" -}}
{{- include "adcf.labels" . }}
rbac.authorization.k8s.io/aggregate-to-admin: "true"
rbac.authorization.k8s.io/aggregate-to-edit: "true"
{{- end }}

{{/*
Generate backup labels
*/}}
{{- define "adcf.backupLabels" -}}
{{- include "adcf.labels" . }}
backup.uars.platform/component: adcf
backup.uars.platform/retention: {{ .Values.backup.retention | quote }}
{{- end }}

{{/*
Generate priority class name
*/}}
{{- define "adcf.priorityClassName" -}}
{{- if .Values.priorityClassName }}
priorityClassName: {{ .Values.priorityClassName }}
{{- else }}
priorityClassName: system-cluster-critical
{{- end }}
{{- end }}

{{/*
Generate topology spread constraints
*/}}
{{- define "adcf.topologySpreadConstraints" -}}
{{- if .Values.topologySpreadConstraints }}
topologySpreadConstraints:
  {{- toYaml .Values.topologySpreadConstraints | nindent 2 }}
{{- else }}
topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: kubernetes.io/hostname
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        {{- include "adcf.selectorLabels" . | nindent 8 }}
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: ScheduleAnyway
    labelSelector:
      matchLabels:
        {{- include "adcf.selectorLabels" . | nindent 8 }}
{{- end }}
{{- end }}
