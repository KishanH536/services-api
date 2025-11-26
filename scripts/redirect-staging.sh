#!/usr/bin/env sh

# This script assumes that:
# - you have configured your local environment to access the MCAP Staging k8s cluster (https://confluence.mot-solutions.com/pages/viewpage.action?pageId=413608203)
# - you have used the AWS CLI to login recently (https://confluence.mot-solutions.com/display/CLSINFRA/Access+AWS+with+MSI+SSO)
kubectl -n default port-forward svc/alarm-processor 9095:8080 &
kubectl -n ai port-forward svc/faces-serve-svc 8091:8000 &

wait
