{{/*
Expand the name of the chart.
*/}}
{{- define "k8s-jacoco-operator.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "k8s-jacoco-operator.fullname" -}}
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
{{- define "k8s-jacoco-operator.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "k8s-jacoco-operator.labels" -}}
helm.sh/chart: {{ include "k8s-jacoco-operator.chart" . }}
{{ include "k8s-jacoco-operator.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "k8s-jacoco-operator.selectorLabels" -}}
app.kubernetes.io/name: {{ include "k8s-jacoco-operator.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "k8s-jacoco-operator.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "k8s-jacoco-operator.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Agent download job spec, used in both the cron and immediate download 
*/}}
{{- define "k8s-jacoco-operator.downloadJobSpec" -}}
spec:
  backoffLimit: 3
  activeDeadlineSeconds: 600
  ttlSecondsAfterFinished: 300
  # Pod Template
  template:
    # Pod Spec
    spec:
      securityContext:
        runAsUser: 1000
        runAsGroup: 1000
        fsGroup: 1000
      volumes:
        - name: script
          configMap:
            name: {{ .Release.Name }}-scripts
            items:
              - key: download-agent.js
                path: entry-point.js
                mode: 0755
        - name: agents
          persistentVolumeClaim:
            claimName: {{ .Release.Name }}-agents
            readOnly: false
      containers:
      - volumeMounts:
          - name: script
            mountPath: /job/
          - name: agents
            mountPath: /mnt/jacoco
        name: agent-downloader
        image: node:lts-alpine
        imagePullPolicy: Always
        command: ["node", "/job/entry-point.js"]
      restartPolicy: Never
{{- end -}}