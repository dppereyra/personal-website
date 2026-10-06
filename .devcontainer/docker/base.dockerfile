ARG IMAGE_VERSION=ubuntu-24.04
FROM mcr.microsoft.com/devcontainers/base:${IMAGE_VERSION}

# Match devcontainer.json's remoteUser so the image does not default to root.
USER vscode
