FROM ubuntu:latest
LABEL authors="triva"

ENTRYPOINT ["top", "-b"]