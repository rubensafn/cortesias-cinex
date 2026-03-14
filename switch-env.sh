#!/bin/sh

PROD_URL="https://eofwwzeqdwsmthiszuwa.supabase.co"
PROD_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvZnd3emVxZHdzbXRoaXN6dXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjk1OTksImV4cCI6MjA4ODgwNTU5OX0.kTbZNI2LB8E8TMy1GSICG0D1gKeDiR9XBt2vDcqy_5c"

DEV_URL="https://gdtfwmqbvsqtxtccrydv.supabase.co"
DEV_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkdGZ3bXFidnNxdHh0Y2NyeWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MDQyMzEsImV4cCI6MjA4ODk4MDIzMX0._tNQNsL332F0qfByCTmcBFNoLq6Cd8YIJcercKMtc0g"

if [ "$1" = "prod" ]; then
  echo "VITE_SUPABASE_URL=$PROD_URL" > .env
  echo "VITE_SUPABASE_ANON_KEY=$PROD_KEY" >> .env
  echo "Trocado para PRODUCAO"
elif [ "$1" = "dev" ]; then
  echo "VITE_SUPABASE_URL=$DEV_URL" > .env
  echo "VITE_SUPABASE_ANON_KEY=$DEV_KEY" >> .env
  echo "Trocado para DESENVOLVIMENTO"
elif [ "$1" = "status" ]; then
  CURRENT=$(grep VITE_SUPABASE_URL .env 2>/dev/null | cut -d= -f2)
  case "$CURRENT" in
    *eofww*)
      echo "Ambiente ativo: PRODUCAO (eofww...)"
      ;;
    *gdtfw*)
      echo "Ambiente ativo: DESENVOLVIMENTO (gdtfw...)"
      ;;
    *)
      echo "Ambiente ativo: desconhecido ($CURRENT)"
      ;;
  esac
else
  echo "Uso: ./switch-env.sh [prod|dev|status]"
  echo ""
  echo "  prod    - Aponta .env para producao (eofww...)"
  echo "  dev     - Aponta .env para desenvolvimento (gdtfw...)"
  echo "  status  - Mostra qual ambiente esta ativo"
  echo ""
  CURRENT=$(grep VITE_SUPABASE_URL .env 2>/dev/null | cut -d= -f2)
  case "$CURRENT" in
    *eofww*)
      echo "Ambiente ativo: PRODUCAO (eofww...)"
      ;;
    *gdtfw*)
      echo "Ambiente ativo: DESENVOLVIMENTO (gdtfw...)"
      ;;
    *)
      echo "Ambiente ativo: desconhecido ($CURRENT)"
      ;;
  esac
fi
