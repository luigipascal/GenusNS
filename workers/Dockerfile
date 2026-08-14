# Slim Contabo worker: MiniMax API + ffmpeg trim. No GPU.
FROM python:3.12-slim-bookworm
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY scripts/minimax_client.py scripts/daily_autonomy.py scripts/publish_daily.py scripts/newsletter_weekly.py /app/
# publish_daily expects GenusNS parent layout — daily_autonomy sets GENUSNS_DATA_DIR
ENV GENUSNS_DATA_DIR=/data
CMD ["python", "daily_autonomy.py"]
