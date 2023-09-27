# Tekton-pipeline

This repo builds the backstage image we use for janus IDP.

## Requirements

- Install tekton pipelines. You can find a reference from here: https://docs.openshift.com/container-platform/4.9/cicd/pipelines/installing-pipelines.html
- Container registry authentication configured. In our case we created a file named quay-credentials.yml. You can find how to set it up from here: https://access.redhat.com/documentation/en-us/red_hat_quay/3.4/html-single/use_red_hat_quay/index#allow-robot-access-user-repo

## Build the image


```console
$ oc new-project tekton-tasks

$ kubectl apply -f quay-credentials.yml

$ kubectl apply -f pipeline.yaml

$ kubectl create -f pipelinerun.yaml

$ pipelinerun.tekton.dev/clone-build-push-run-4kgjr created

$ tkn pipelinerun logs  clone-build-push-run-4kgjr -f
```
