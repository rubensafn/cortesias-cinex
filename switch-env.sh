#!/bin/bash

PROD_URL="https://eofwwzeqdwsmthiszuwa.supabase.co"
PROD_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvZnd3emVxZHdzbXRoaXN6dXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjk1OTksImV4cCI6MjA4ODgwNTU5OX0.kTbZNI2LB8E8TMy1GSICG0D1gKeDiR9XBt2vDcqy_5c"

DEV_URL="https://gdtfwmqbvsqtxtccrydv.supabase.co"
DEV_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkdGZ3bXFidnNxdHh0Y2NyeWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MDQyMzEsImV4cCI6MjA4ODk4MDIzMX0._tNQNsL332F0qfByCTmcBFNoLq6Cd8YIJcercKMtc0g"

usage() {
  echo "Uso: ./switch-env.sh [prod|dev|status]"
  echo ""
  echo "  prod    - Aponta .env para producao (eofww...)"
  echo "  dev     - Aponta .env para desenvolvimento (gdtfw...)"
  echo "  status  - Mostra qual ambiente esta ativo"
}

status() {
  CURRENT=$(grep VITE_SUPABASE_URL .env | cut -d= -f2)
  if [[ "$CURRENT" == *"eofww"* ]]; then
    echo "Ambiente ativo: PRODUCAO (eofww...)"
  elif [[ "$CURRENT" == *"gdtfw"* ]]; then
    echo "Ambiente ativo: DESENVOLVIMENTO (gdtfw...)"
  else
    echo "Ambiente ativo: desconhecido ($CURRENT)"
  fi
}

case "$1" in
  prod)
    printf "\nVITE_SUPABASE_URL=%s\nVITE_SUPABASE_ANON_KEY=%s\n" "$PROD_URL" "$PROD_KEY" > .env
    echo "Trocado para PRODUCAO"
    ;;
  dev)
    printf "\nVITE_SUPABASE_URL=%s\nVITE_SUPABASE_ANON_KEY=%s\n" "$DEV_URL" "$DEV_KEY" > .env
    echo "Trocado para DESENVOLVIMENTO"
    ;;
  status)
    status
    ;;
  *)
    usage
    status
    ;;
esac
