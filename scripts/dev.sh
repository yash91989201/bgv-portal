#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ -n "${NO_COLOR:-}" ]]; then
  COLOR_RESET=""
  COLOR_RED=""
  COLOR_GREEN=""
  COLOR_YELLOW=""
  COLOR_BLUE=""
else
  COLOR_RESET="\033[0m"
  COLOR_RED="\033[31m"
  COLOR_GREEN="\033[32m"
  COLOR_YELLOW="\033[33m"
  COLOR_BLUE="\033[34m"
fi

DOCKER_COMPOSE_CMD=()
START_WAS_INTERRUPTED="false"
BUN_DEV_PID=""
STUDIO_PID=""
TYPE_WATCHER_PIDS=()
VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""

DEV_S3_ACCESS_KEY="GuzpNFteD5xLQ_aoBlUvyw"
DEV_S3_SECRET_KEY="zmvR18mhKg3hDlKfdtfp_g"
DEV_S3_ENDPOINT="http://127.0.0.1:9000"

ENV_SERVER="apps/server/.env"
ENV_WEB="apps/web/.env"
ENV_WWW="apps/www/.env"
ENV_NOTIFICATION="workers/notification/.env"
ENV_SEARCH="workers/message-search/.env"
ENV_READ_RECEIPT="workers/read-receipt/.env"

CORE_SERVICES=(
  postgres
  electric
  dragonfly
  rabbitmq
  opensearch
  rustfs
  soketi
  imgproxy
)

DOCTOR_PORTS=(
  5432
  5003
  6379
  5672
  9200
  9000
  6001
  8080
)

log_info() { printf "%b[INFO]%b %s\n" "$COLOR_BLUE" "$COLOR_RESET" "$*"; }
log_success() { printf "%b[OK]%b %s\n" "$COLOR_GREEN" "$COLOR_RESET" "$*"; }
log_warn() { printf "%b[WARN]%b %s\n" "$COLOR_YELLOW" "$COLOR_RESET" "$*"; }
log_error() { printf "%b[ERROR]%b %s\n" "$COLOR_RED" "$COLOR_RESET" "$*" >&2; }

check_command() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || {
    log_error "Missing command: $cmd"
    return 1
  }
}

require_root() {
  [[ -f "$ROOT_DIR/package.json" ]] || {
    log_error "Run from repository root: $ROOT_DIR"
    exit 1
  }
}

detect_docker_compose() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD=(docker compose)
    return 0
  fi
  if command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD=(docker-compose)
    return 0
  fi
  log_error "Neither 'docker compose' nor 'docker-compose' is available"
  return 1
}

docker_compose() { "${DOCKER_COMPOSE_CMD[@]}" "$@"; }

check_deps() {
  check_command bun
  check_command docker
  detect_docker_compose
}

generate_better_auth_secret() {
  local secret=""
  if secret="$(npx --yes auth secret 2>/dev/null)" && [[ -n "$secret" ]]; then
    :
  elif secret="$(bunx auth secret 2>/dev/null)" && [[ -n "$secret" ]]; then
    :
  else
    secret="$(openssl rand -base64 32 2>/dev/null)"
  fi

  secret="$(printf '%s' "$secret" | tr -d '\r\n')"
  if [[ -n "$secret" ]]; then
    printf '%s' "$secret"
    return 0
  fi

  log_error "Failed to generate BETTER_AUTH_SECRET"
  return 1
}

generate_vapid_keys() {
  local out=""
  if ! out="$(bunx web-push generate-vapid-keys --json 2>/dev/null)"; then
    log_warn "web-push generate-vapid-keys unavailable; VAPID fields will be empty"
    VAPID_PUBLIC_KEY=""
    VAPID_PRIVATE_KEY=""
    return 0
  fi
  if [[ -z "$out" ]]; then
    log_warn "web-push output empty; VAPID fields will be empty"
    VAPID_PUBLIC_KEY=""
    VAPID_PRIVATE_KEY=""
    return 0
  fi
  VAPID_PUBLIC_KEY="$(printf '%s' "$out" | bun -e 'const fs=require("node:fs");const s=fs.readFileSync(0,"utf8");try{const j=JSON.parse(s);process.stdout.write(j.publicKey??"")}catch{process.stdout.write("")}')"
  VAPID_PRIVATE_KEY="$(printf '%s' "$out" | bun -e 'const fs=require("node:fs");const s=fs.readFileSync(0,"utf8");try{const j=JSON.parse(s);process.stdout.write(j.privateKey??"")}catch{process.stdout.write("")}')"
  if [[ -z "$VAPID_PUBLIC_KEY" || -z "$VAPID_PRIVATE_KEY" ]]; then
    log_warn "web-push keys parse failed; VAPID fields will be empty"
    VAPID_PUBLIC_KEY=""
    VAPID_PRIVATE_KEY=""
  else
    log_success "VAPID keys generated"
  fi
}

ensure_parent_dir() { mkdir -p "$(dirname "$1")"; }

env_value_is_empty() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  [[ -z "$value" || "$value" == '""' || "$value" == "''" ]]
}

trim_whitespace() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}

ensure_env_default() {
  local target="$1"
  local key="$2"
  local value="$3"
  local tmp=""
  local line=""
  local found="false"
  local changed="false"

  tmp="$(mktemp)"
  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" == "$key="* ]]; then
      found="true"
      local current_value="${line#"$key="}"
      if env_value_is_empty "$current_value"; then
        if env_value_is_empty "$value"; then
          printf '%s\n' "$line" >>"$tmp"
        else
          printf '%s=%s\n' "$key" "$value" >>"$tmp"
          changed="true"
        fi
      else
        printf '%s\n' "$line" >>"$tmp"
      fi
      continue
    fi
    printf '%s\n' "$line" >>"$tmp"
  done <"$target"

  if [[ "$found" == "false" ]]; then
    printf '%s=%s\n' "$key" "$value" >>"$tmp"
    changed="true"
  fi

  if [[ "$changed" == "true" ]]; then
    mv "$tmp" "$target"
  else
    rm -f "$tmp"
  fi

  [[ "$changed" == "true" ]]
}

ensure_env_csv_contains() {
  local target="$1"
  local key="$2"
  local value="$3"
  local tmp=""
  local line=""
  local found="false"
  local changed="false"

  tmp="$(mktemp)"
  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" == "$key="* ]]; then
      found="true"
      local current_value="${line#"$key="}"

      if env_value_is_empty "$current_value"; then
        printf '%s=%s\n' "$key" "$value" >>"$tmp"
        changed="true"
        continue
      fi

      local -a origins=()
      local has_value="false"
      local -a raw_origins=()
      local origin=""
      IFS=',' read -r -a raw_origins <<<"$current_value"
      for origin in "${raw_origins[@]}"; do
        local trimmed=""
        trimmed="$(trim_whitespace "$origin")"
        [[ -z "$trimmed" ]] && continue
        if [[ "$trimmed" == "$value" ]]; then
          has_value="true"
        fi
        origins+=("$trimmed")
      done

      if [[ "$has_value" == "false" ]]; then
        origins+=("$value")
      fi

      local next_value=""
      next_value="$(
        IFS=,
        printf '%s' "${origins[*]}"
      )"
      if [[ "$next_value" != "$current_value" ]]; then
        changed="true"
      fi
      printf '%s=%s\n' "$key" "$next_value" >>"$tmp"
      continue
    fi
    printf '%s\n' "$line" >>"$tmp"
  done <"$target"

  if [[ "$found" == "false" ]]; then
    printf '%s=%s\n' "$key" "$value" >>"$tmp"
    changed="true"
  fi

  if [[ "$changed" == "true" ]]; then
    mv "$tmp" "$target"
  else
    rm -f "$tmp"
  fi

  [[ "$changed" == "true" ]]
}

write_env_defaults() {
  local target="$1"
  local rel_target="${target#"$ROOT_DIR"/}"
  local -a env_lines=()

  mapfile -t env_lines
  ensure_parent_dir "$target"

  if [[ ! -f "$target" ]]; then
    printf '%s\n' "${env_lines[@]}" >"$target"
    log_success "Created $rel_target"
    return 0
  fi

  local changed="false"
  local env_line=""
  for env_line in "${env_lines[@]}"; do
    [[ -z "$env_line" || "$env_line" == \#* ]] && continue
    local key="${env_line%%=*}"
    local value="${env_line#*=}"
    if ensure_env_default "$target" "$key" "$value"; then
      changed="true"
    fi
  done

  if [[ "$changed" == "true" ]]; then
    log_success "Backfilled missing env values in $rel_target"
  else
    log_warn "Keeping existing file: $rel_target"
  fi
}

create_env_server() {
  local secret="$1"
  write_env_defaults "$ROOT_DIR/$ENV_SERVER" <<EOF
BETTER_AUTH_SECRET=$secret
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3001,http://localhost:5100
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://admin:admin@localhost:5672
ENV=development
PORT=3000
S3_ACCESS_KEY=$DEV_S3_ACCESS_KEY
S3_SECRET_KEY=$DEV_S3_SECRET_KEY
S3_ENDPOINT=$DEV_S3_ENDPOINT
WEB_URL=http://localhost:3001
ELECTRIC_URL=http://localhost:5003
ELECTRIC_SECRET=dev-electric-secret
VAPID_PUBLIC_KEY=$VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY=$VAPID_PRIVATE_KEY
VAPID_SUBJECT=mailto:dev@localhost
PUSHER_APP_ID=work-holo
PUSHER_APP_KEY=work-holo-key
PUSHER_APP_SECRET=work-holo-secret-must-be-32-chars
PUSHER_HOST=localhost
PUSHER_PORT=6001
CASBIN_ENFORCE=false
OPENSEARCH_URL=http://localhost:9200
EOF
  if ensure_env_csv_contains "$ROOT_DIR/$ENV_SERVER" "CORS_ORIGIN" "http://localhost:5100"; then
    log_success "Ensured CORS_ORIGIN includes http://localhost:5100 in $ENV_SERVER"
  fi

}

create_env_web() {
  write_env_defaults "$ROOT_DIR/$ENV_WEB" <<EOF
VITE_ENV=development
VITE_IMAGE_TRANSFORMATION_URL=http://localhost:8080
VITE_SERVER_URL=http://localhost:3000
VITE_WEB_URL=http://localhost:3001
VAPID_PUBLIC_KEY=$VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY=$VAPID_PRIVATE_KEY
VAPID_SUBJECT=mailto:dev@localhost
VITE_PUSHER_KEY=work-holo-key
VITE_PUSHER_HOST=localhost
VITE_PUSHER_PORT=6001
EOF
}

create_env_www() {
  write_env_defaults "$ROOT_DIR/$ENV_WWW" <<EOF
VITE_ENV=development
VITE_WWW_URL=http://localhost:5100
VITE_SERVER_URL=http://localhost:3000
VITE_IMAGE_TRANSFORMATION_URL=http://localhost:8080
EOF
}

create_env_notification() {
  write_env_defaults "$ROOT_DIR/$ENV_NOTIFICATION" <<EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
RABBITMQ_URL=amqp://admin:admin@localhost:5672
PUSHER_APP_ID=work-holo
PUSHER_APP_KEY=work-holo-key
PUSHER_APP_SECRET=work-holo-secret-must-be-32-chars
PUSHER_HOST=localhost
PUSHER_PORT=6001
VAPID_PUBLIC_KEY=$VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY=$VAPID_PRIVATE_KEY
VAPID_SUBJECT=mailto:dev@localhost
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=dev-smtp-user
SMTP_PASS=dev-smtp-pass
SMTP_FROM=dev@work-holo.local
ENV=development
EOF
}

create_env_search() {
  write_env_defaults "$ROOT_DIR/$ENV_SEARCH" <<EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
RABBITMQ_URL=amqp://admin:admin@localhost:5672
OPENSEARCH_URL=http://localhost:9200
ENV=development
EOF
}

create_env_read_receipt() {
  write_env_defaults "$ROOT_DIR/$ENV_READ_RECEIPT" <<EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
RABBITMQ_URL=amqp://admin:admin@localhost:5672
ENV=development
EOF
}

create_env_files() {
  local secret
  secret="$(generate_better_auth_secret)"
  generate_vapid_keys
  create_env_server "$secret"
  create_env_web
  create_env_www
  create_env_notification
  create_env_search
  create_env_read_receipt
}

compose_up() { docker_compose up -d; }
compose_down() { docker_compose down; }
compose_stop() { docker_compose stop; }

wait_healthy() {
  local timeout=180
  local poll_interval=3
  local elapsed=0

  log_info "Waiting for all Docker services"
  while [[ "$elapsed" -lt "$timeout" ]]; do
    local ready_count=0
    local total_count="${#CORE_SERVICES[@]}"
    local service=""

    for service in "${CORE_SERVICES[@]}"; do
      local id=""
      id="$(docker_compose ps -q "$service" 2>/dev/null || true)"
      if [[ -n "$id" ]]; then
        local state=""
        state="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$id" 2>/dev/null || true)"
        if [[ "$state" == "healthy" || "$state" == "running" ]]; then
          ready_count=$((ready_count + 1))
        fi
      fi
    done

    if [[ "$ready_count" -eq "$total_count" ]]; then
      printf "\r\033[K"
      log_success "All services ready: $ready_count/$total_count"
      return 0
    fi

    printf "\r  %b⏳%b Services ready: %d/%d" "$COLOR_YELLOW" "$COLOR_RESET" "$ready_count" "$total_count"
    sleep "$poll_interval"
    elapsed=$((elapsed + poll_interval))
  done

  printf "\n"
  log_error "Services not ready after ${timeout}s"
  return 1
}

migrate_database() {
  (
    cd "$ROOT_DIR/packages/db"
    bun run db:migrate
  )
}

cmd_seed() {
  bun run --cwd apps/seeder src/index.ts "$@"
}

cmd_bootstrap_dev_workspace() {
  bun run --cwd apps/seeder seed:dev-bootstrap
}

cmd_init() {
  local -a INIT_STEPS=(check-deps deps-install create-env start-compose wait-healthy migrate seed bootstrap-dev-workspace)

  declare -A STEP_DEPS=(
    [start - compose]="check-deps"
    [wait - healthy]="start-compose"
    [migrate]="wait-healthy"
    [seed]="migrate"
    [bootstrap - dev - workspace]="seed"
  )

  local list_steps="false"
  local -a skip_values=()
  local -a SKIP_STEPS=()
  declare -A SKIP_SET=()

  trim_spaces() {
    local value="$1"
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"
    printf '%s' "$value"
  }

  in_init_steps() {
    local step="$1"
    local s=""
    for s in "${INIT_STEPS[@]}"; do
      if [[ "$s" == "$step" ]]; then
        return 0
      fi
    done
    return 1
  }

  is_skipped() {
    local step="$1"
    [[ -n "${SKIP_SET[$step]+x}" ]]
  }

  collect_downstream_steps() {
    local root_step="$1"
    local -a queue=("$root_step")
    local q_index=0
    declare -A visited=()

    while [[ "$q_index" -lt "${#queue[@]}" ]]; do
      local current="${queue[$q_index]}"
      q_index=$((q_index + 1))
      local candidate=""
      for candidate in "${INIT_STEPS[@]}"; do
        local deps="${STEP_DEPS[$candidate]:-}"
        [[ -z "$deps" ]] && continue
        local dep=""
        for dep in $deps; do
          if [[ "$dep" == "$current" && -z "${visited[$candidate]+x}" ]]; then
            visited["$candidate"]=1
            queue+=("$candidate")
            break
          fi
        done
      done
    done

    local ordered=()
    local step=""
    for step in "${INIT_STEPS[@]}"; do
      if [[ -n "${visited[$step]+x}" ]]; then
        ordered+=("$step")
      fi
    done
    printf '%s\n' "${ordered[@]}"
  }

  while [[ $# -gt 0 ]]; do
    case "$1" in
    --skip-steps)
      if [[ $# -lt 2 ]]; then
        log_error "Missing value for --skip-steps"
        exit 1
      fi
      skip_values+=("$2")
      shift 2
      ;;
    --skip-steps=*)
      skip_values+=("${1#--skip-steps=}")
      shift
      ;;
    --list-steps)
      list_steps="true"
      shift
      ;;
    *)
      log_error "Unknown option: $1"
      cmd_help
      exit 1
      ;;
    esac
  done

  local raw_value=""
  for raw_value in "${skip_values[@]}"; do
    [[ -z "$raw_value" ]] && continue
    local -a split_steps=()
    IFS=',' read -r -a split_steps <<<"$raw_value"
    local candidate=""
    for candidate in "${split_steps[@]}"; do
      candidate="$(trim_spaces "$candidate")"
      [[ -z "$candidate" ]] && continue
      if [[ -z "${SKIP_SET[$candidate]+x}" ]]; then
        SKIP_SET["$candidate"]=1
        SKIP_STEPS+=("$candidate")
      fi
    done
  done

  if [[ "$list_steps" == "true" ]]; then
    printf 'Available init steps:\n'
    local index=1
    local step=""
    for step in "${INIT_STEPS[@]}"; do
      local deps="${STEP_DEPS[$step]:-}"
      if [[ -z "$deps" ]]; then
        printf '  %d. %-18s (no dependencies)\n' "$index" "$step"
      else
        local deps_display="${deps// /, }"
        printf '  %d. %-18s (depends: %s)\n' "$index" "$step" "$deps_display"
      fi
      index=$((index + 1))
    done
    return 0
  fi

  local available_steps=""
  local available_step=""
  for available_step in "${INIT_STEPS[@]}"; do
    if [[ -z "$available_steps" ]]; then
      available_steps="$available_step"
    else
      available_steps="${available_steps}, $available_step"
    fi
  done
  local skipped_step=""
  for skipped_step in "${SKIP_STEPS[@]}"; do
    if ! in_init_steps "$skipped_step"; then
      log_error "Unknown step '$skipped_step'. Available steps: $available_steps"
      exit 1
    fi
  done

  local has_conflict="false"
  for skipped_step in "${SKIP_STEPS[@]}"; do
    local -a downstream=()
    mapfile -t downstream < <(collect_downstream_steps "$skipped_step")
    local -a orphaned=()
    local downstream_step=""
    for downstream_step in "${downstream[@]}"; do
      [[ -z "$downstream_step" ]] && continue
      if ! is_skipped "$downstream_step"; then
        orphaned+=("$downstream_step")
      fi
    done

    if [[ "${#orphaned[@]}" -gt 0 ]]; then
      local orphaned_display=""
      local orphaned_step=""
      for orphaned_step in "${orphaned[@]}"; do
        if [[ -z "$orphaned_display" ]]; then
          orphaned_display="$orphaned_step"
        else
          orphaned_display="${orphaned_display}, $orphaned_step"
        fi
      done
      log_error "Cannot skip '$skipped_step': the following steps depend on it (directly or transitively): $orphaned_display"
      log_error "To skip '$skipped_step', also include in --skip-steps: $orphaned_display"
      has_conflict="true"
    fi
  done

  if [[ "$has_conflict" == "true" ]]; then
    exit 1
  fi

  require_root
  local step=""
  for step in "${INIT_STEPS[@]}"; do
    if is_skipped "$step"; then
      log_warn "Skipping step: $step"
      continue
    fi
    log_info "Running step: $step"
    case "$step" in
    check-deps) check_deps ;;
    deps-install) bun install ;;
    create-env) create_env_files ;;
    start-compose) compose_up ;;
    wait-healthy) wait_healthy ;;
    migrate) migrate_database ;;
    seed) cmd_seed ;;
    bootstrap-dev-workspace) cmd_bootstrap_dev_workspace ;;
    esac
  done
  read -r -p "Start development processes now? [y/N] " start_now
  if [[ "$start_now" == "y" || "$start_now" == "Y" ]]; then
    cmd_start
  else
    log_success "Init completed"
  fi
}

handle_interrupt() {
  START_WAS_INTERRUPTED="true"
  if [[ -n "$BUN_DEV_PID" ]]; then
    kill -INT "$BUN_DEV_PID" >/dev/null 2>&1 || true
  fi
  stop_studio
  stop_type_watchers
  printf "\n"
  local i
  local response=""
  for ((i = 5; i > 0; i--)); do
    printf "\r%bStopping docker services in %ds%b... Press 'n' to keep running" "$COLOR_YELLOW" "$i" "$COLOR_RESET"
    if read -r -t 1 -n 1 response; then
      break
    fi
  done
  printf "\n"
  if [[ "$response" == "n" || "$response" == "N" ]]; then
    log_warn "Keeping services running"
  else
    cmd_stop
  fi
}

# Start type generators in watch mode based on run targets
# Maps run targets to package directories that have type generators
start_type_watchers() {
  local -a run_targets=("$@")
  local -a type_gen_dirs=()

  if [[ ${#run_targets[@]} -eq 0 ]]; then
    # No filters = run all type generators
    type_gen_dirs=("apps/web" "packages/api" "packages/db")
  else
    local target=""
    for target in "${run_targets[@]}"; do
      case "$target" in
      all)
        type_gen_dirs=("apps/web" "packages/api" "packages/db")
        break
        ;;
      web)
        type_gen_dirs+=("apps/web")
        ;;
      server | studio)
        type_gen_dirs+=("packages/api" "packages/db")
        ;;
      # www, read-receipt, message-search, notification have no type generators
      esac
    done
  fi

  # Deduplicate
  local -a unique_dirs=()
  local dir=""
  for dir in "${type_gen_dirs[@]}"; do
    local found="false"
    local udir=""
    for udir in "${unique_dirs[@]}"; do
      if [[ "$udir" == "$dir" ]]; then
        found="true"
        break
      fi
    done
    if [[ "$found" == "false" ]]; then
      unique_dirs+=("$dir")
    fi
  done

  for dir in "${unique_dirs[@]}"; do
    if [[ -f "$ROOT_DIR/$dir/package.json" ]] && grep -q '"generate:types:watch"' "$ROOT_DIR/$dir/package.json"; then
      log_info "Starting type watcher: $dir"
      (cd "$ROOT_DIR/$dir" && bun run generate:types:watch) &
      TYPE_WATCHER_PIDS+=("$!")
    fi
  done
}

# Kill all running type watcher processes
stop_type_watchers() {
  local pid=""
  for pid in "${TYPE_WATCHER_PIDS[@]}"; do
    kill -TERM "$pid" >/dev/null 2>&1 || true
  done
  for pid in "${TYPE_WATCHER_PIDS[@]}"; do
    wait "$pid" 2>/dev/null || true
  done
  TYPE_WATCHER_PIDS=()
}

should_run_studio() {
  local -a run_targets=("$@")
  if [[ ${#run_targets[@]} -eq 0 ]]; then
    return 0
  fi
  local target=""
  for target in "${run_targets[@]}"; do
    if [[ "$target" == "all" || "$target" == "studio" ]]; then
      return 0
    fi
  done
  return 1
}

start_studio() {
  local -a run_targets=("$@")
  if ! should_run_studio "${run_targets[@]}"; then
    return 0
  fi
  log_info "Starting Drizzle Studio (https://local.drizzle.studio)"
  (
    cd "$ROOT_DIR/packages/db"
    bun run db:studio
  ) &
  STUDIO_PID="$!"
}

should_run_turbo_dev() {
  local -a run_targets=("$@")
  if [[ ${#run_targets[@]} -eq 0 ]]; then
    return 0
  fi
  local target=""
  for target in "${run_targets[@]}"; do
    if [[ "$target" != "studio" ]]; then
      return 0
    fi
  done
  return 1
}

stop_studio() {
  if [[ -z "$STUDIO_PID" ]]; then
    return 0
  fi
  kill -TERM "$STUDIO_PID" >/dev/null 2>&1 || true
  wait "$STUDIO_PID" 2>/dev/null || true
  STUDIO_PID=""
}

cmd_start() {
  require_root
  check_deps

  local docker_only="false"
  local dev_only="false"
  local -a run_values=()
  local -a run_targets=()

  while [[ $# -gt 0 ]]; do
    case "$1" in
    --docker-only)
      docker_only="true"
      shift
      ;;
    --dev-only)
      dev_only="true"
      shift
      ;;
    --run)
      if [[ $# -lt 2 ]]; then
        log_error "Missing value for --run"
        log_error "Example: scripts/dev.sh start --run web,server,studio"
        log_error "See README.md for full --run target list and usage details"
        exit 1
      fi
      run_values+=("$2")
      shift 2
      ;;
    --run=*)
      run_values+=("${1#--run=}")
      shift
      ;;
    *)
      log_error "Unknown option: $1"
      cmd_help
      exit 1
      ;;
    esac
  done

  local raw_run_value=""
  for raw_run_value in "${run_values[@]}"; do
    [[ -z "$raw_run_value" ]] && continue
    local -a split_targets=()
    IFS=',' read -r -a split_targets <<<"$raw_run_value"
    local target=""
    for target in "${split_targets[@]}"; do
      target="$(trim_whitespace "$target")"
      [[ -z "$target" ]] && continue
      run_targets+=("$target")
    done
  done

  local -a turbo_filters=()
  local run_target=""
  for run_target in "${run_targets[@]}"; do
    case "$run_target" in
    all) ;;
    web) turbo_filters+=("-F" "web") ;;
    www) turbo_filters+=("-F" "www") ;;
    server) turbo_filters+=("-F" "server") ;;
    read-receipt) turbo_filters+=("-F" "read-receipt") ;;
    message-search | message-indexer) turbo_filters+=("-F" "message-search") ;;
    notification) turbo_filters+=("-F" "@work-holo/notification-worker") ;;
    studio) ;;
    *)
      log_error "Unknown run target '$run_target'. Allowed: all, web, www, server, studio, read-receipt, message-search, message-indexer, notification"
      log_error "See README.md for full --run target list and usage details"
      exit 1
      ;;
    esac
  done

  if [[ "$docker_only" == "true" && "$dev_only" == "true" ]]; then
    log_error "Cannot use both --docker-only and --dev-only"
    exit 1
  fi

  if [[ "$docker_only" == "true" && "${#turbo_filters[@]}" -gt 0 ]]; then
    log_error "--run cannot be used with --docker-only"
    exit 1
  fi

  if [[ "$docker_only" == "true" ]]; then
    compose_up
    wait_healthy
    log_success "Docker services started"
    return 0
  fi

  if [[ "$dev_only" == "true" ]]; then
    local running_count=0
    local service=""
    for service in "${CORE_SERVICES[@]}"; do
      local id=""
      id="$(docker_compose ps -q "$service" 2>/dev/null || true)"
      if [[ -n "$id" ]]; then
        local state=""
        state="$(docker inspect --format '{{.State.Status}}' "$id" 2>/dev/null || true)"
        if [[ "$state" == "running" ]]; then
          running_count=$((running_count + 1))
        fi
      fi
    done

    if [[ "$running_count" -eq 0 ]]; then
      log_info "No Docker services running. Starting services first..."
      compose_up
      wait_healthy
    elif [[ "$running_count" -lt "${#CORE_SERVICES[@]}" ]]; then
      log_warn "Only $running_count/${#CORE_SERVICES[@]} services are running. Some features may not work."
    fi

    start_type_watchers "${run_targets[@]}"
    start_studio "${run_targets[@]}"
    local dev_rc=0
    if should_run_turbo_dev "${run_targets[@]}"; then
      log_info "Starting dev server (with TUI)"
      if [[ "${#turbo_filters[@]}" -gt 0 ]]; then
        bun run dev -- "${turbo_filters[@]}"
      else
        bun dev
      fi
      dev_rc=$?
    elif [[ -n "$STUDIO_PID" ]]; then
      log_info "Drizzle Studio running; press Ctrl+C to stop"
      wait "$STUDIO_PID" || dev_rc=$?
    fi
    stop_studio
    stop_type_watchers
    return $dev_rc
  fi

  compose_up
  wait_healthy
  START_WAS_INTERRUPTED="false"
  trap handle_interrupt INT
  start_type_watchers "${run_targets[@]}"
  start_studio "${run_targets[@]}"
  local code=0
  set +e
  if should_run_turbo_dev "${run_targets[@]}"; then
    if [[ "${#turbo_filters[@]}" -gt 0 ]]; then
      TURBO_UI=0 bun run dev -- "${turbo_filters[@]}" &
    else
      TURBO_UI=0 bun dev &
    fi
    BUN_DEV_PID="$!"
    wait "$BUN_DEV_PID"
    code=$?
    BUN_DEV_PID=""
  elif [[ -n "$STUDIO_PID" ]]; then
    log_info "Drizzle Studio running; press Ctrl+C to stop"
    wait "$STUDIO_PID"
    code=$?
  fi
  set -e
  trap - INT
  stop_studio
  stop_type_watchers
  if [[ "$START_WAS_INTERRUPTED" == "true" ]]; then
    return 0
  fi
  if [[ "$code" -ne 0 ]]; then
    log_warn "dev process exited with code $code"
  fi
}

cmd_stop() {
  require_root
  check_deps
  compose_stop
}

cmd_reset_services() {
  require_root
  check_deps

  local -a init_args=()
  while [[ $# -gt 0 ]]; do
    case "$1" in
    --skip-init-steps)
      if [[ $# -lt 2 ]]; then
        log_error "Missing value for --skip-init-steps"
        exit 1
      fi
      if [[ -z "$2" ]]; then
        log_error "Empty value for --skip-init-steps"
        exit 1
      fi
      init_args+=("--skip-steps" "$2")
      shift 2
      ;;
    --skip-init-steps=*)
      if [[ -z "${1#--skip-init-steps=}" ]]; then
        log_error "Empty value for --skip-init-steps"
        exit 1
      fi
      init_args+=("--skip-steps=${1#--skip-init-steps=}")
      shift
      ;;
    *)
      log_error "Unknown option: $1"
      cmd_help
      exit 1
      ;;
    esac
  done

  log_warn "This will run down --volumes --remove-orphans"
  read -r -p "Continue? [y/N] " answer
  if [[ "$answer" != "y" && "$answer" != "Y" ]]; then
    log_info "Cancelled"
    return 0
  fi
  docker_compose down --volumes --remove-orphans
  cmd_init "${init_args[@]}"
}

cmd_update_packages() {
  require_root
  check_deps
  log_info "Updating root packages"
  (
    cd "$ROOT_DIR"
    bun update --latest
  )
  local parent=""
  local child=""
  for parent in apps packages workers; do
    [[ -d "$ROOT_DIR/$parent" ]] || continue
    for child in "$ROOT_DIR/$parent"/*; do
      if [[ -d "$child" && -f "$child/package.json" ]]; then
        log_info "Updating ${child#"$ROOT_DIR"/}"
        (
          cd "$child"
          bun update --latest
        )
      fi
    done
  done
  log_info "Cleaning up node_modules and lock files"
  for parent in apps packages workers; do
    [[ -d "$ROOT_DIR/$parent" ]] || continue
    for child in "$ROOT_DIR/$parent"/*; do
      if [[ -d "$child" && -f "$child/package.json" ]]; then
        if [[ -d "$child/node_modules" ]]; then
          log_info "Removing ${child#"$ROOT_DIR"/}/node_modules"
          rm -rf "$child/node_modules"
        fi
      fi
    done
  done
  if [[ -f "$ROOT_DIR/bun.lock" ]]; then
    log_info "Removing bun.lock"
    rm -f "$ROOT_DIR/bun.lock"
  fi
  (
    cd "$ROOT_DIR"
    bun install
  )
  log_success "Package updates completed"
}

check_env_exists() {
  local rel="$1"
  if [[ -f "$ROOT_DIR/$rel" ]]; then
    log_success "Found $rel"
    return 0
  fi
  log_error "Missing $rel"
  return 1
}

check_service_running() {
  local service="$1"
  local id=""
  local state=""
  id="$(docker_compose ps -q "$service" 2>/dev/null || true)"
  if [[ -z "$id" ]]; then
    log_error "Service not running: $service"
    return 1
  fi
  state="$(docker inspect --format '{{.State.Status}}' "$id" 2>/dev/null || true)"
  if [[ "$state" == "running" ]]; then
    log_success "Service running: $service"
    return 0
  fi
  log_error "Service status '$state': $service"
  return 1
}

check_port() {
  local port="$1"
  if (echo >/dev/tcp/127.0.0.1/"$port") >/dev/null 2>&1; then
    log_success "Port open: $port"
    return 0
  fi
  log_error "Port closed: $port"
  return 1
}

cmd_doctor() {
  require_root
  local failed=0
  check_deps || failed=1
  check_env_exists "$ENV_SERVER" || failed=1
  check_env_exists "$ENV_WEB" || failed=1
  check_env_exists "$ENV_WWW" || failed=1
  check_env_exists "$ENV_NOTIFICATION" || failed=1
  check_env_exists "$ENV_SEARCH" || failed=1
  check_env_exists "$ENV_READ_RECEIPT" || failed=1
  local s=""
  for s in "${CORE_SERVICES[@]}"; do
    check_service_running "$s" || failed=1
  done
  local p=""
  for p in "${DOCTOR_PORTS[@]}"; do
    check_port "$p" || failed=1
  done
  if [[ "$failed" -eq 0 ]]; then
    log_success "Doctor passed"
    return 0
  fi
  log_error "Doctor found issues"
  return 1
}

cmd_status() {
  require_root
  check_deps
  log_info "Docker Services"
  local service=""
  local running=0
  local total=0
  for service in "${CORE_SERVICES[@]}"; do
    total=$((total + 1))
    local id=""
    id="$(docker_compose ps -q "$service" 2>/dev/null || true)"
    if [[ -n "$id" ]]; then
      local state=""
      state="$(docker inspect --format '{{.State.Status}}' "$id" 2>/dev/null || true)"
      local health=""
      health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}no health check{{end}}' "$id" 2>/dev/null || true)"
      if [[ "$state" == "running" ]]; then
        printf "  %b✓%b %-20s running (%s)\n" "$COLOR_GREEN" "$COLOR_RESET" "$service" "$health"
        running=$((running + 1))
      else
        printf "  %b✗%b %-20s %s\n" "$COLOR_RED" "$COLOR_RESET" "$service" "$state"
      fi
    else
      printf "  %b✗%b %-20s not running\n" "$COLOR_RED" "$COLOR_RESET" "$service"
    fi
  done
  printf "\n"
  log_info "Ports"
  local port=""
  for port in "${DOCTOR_PORTS[@]}"; do
    if (echo >/dev/tcp/127.0.0.1/"$port") >/dev/null 2>&1; then
      printf "  %b✓%b %d open\n" "$COLOR_GREEN" "$COLOR_RESET" "$port"
    else
      printf "  %b✗%b %d closed\n" "$COLOR_RED" "$COLOR_RESET" "$port"
    fi
  done
  printf "\n"
  log_info "Environment Files"
  check_env_exists "$ENV_SERVER" || true
  check_env_exists "$ENV_WEB" || true
  check_env_exists "$ENV_WWW" || true
  check_env_exists "$ENV_NOTIFICATION" || true
  check_env_exists "$ENV_SEARCH" || true
  check_env_exists "$ENV_READ_RECEIPT" || true
  printf "\n"
  if [[ "$running" -eq "$total" ]]; then
    log_success "All $total services running"
  else
    log_warn "$running/$total services running"
  fi
}

cmd_logs() {
  require_root
  check_deps
  local service="${1:-}"
  if [[ -n "$service" ]]; then
    docker_compose logs -f "$service"
  else
    docker_compose logs -f
  fi
}

cmd_help() {
  cat <<'EOF'
work-holo development workflow manager

Usage:
  scripts/dev.sh <command> [options]
  scripts/dev.sh --help
  scripts/dev.sh -h

Commands:
  init [--skip-steps step1,step2] [--list-steps]
  start
  stop-services
  reset-services [--skip-init-steps step1,step2]
  update-packages
  doctor
  status
  logs [service]
  seed [--only=X]

Command behavior:
  status
    - show docker service status
    - show port status
    - show env file status
  init
    - Runs a sequence of initialization steps
    - Steps: check-deps, deps-install, create-env, start-compose, wait-healthy, migrate, seed, bootstrap-dev-workspace
    - Use --skip-steps to skip specific steps (comma-separated)
    - Use --list-steps to see all steps and their dependencies
    - Dependency validation only enforces init step ordering/runtime prerequisites
    - deps-install can be skipped when dependencies were installed manually beforehand
    - Skipping a step that later init steps still depend on will error unless you also skip dependents

  start [--docker-only] [--dev-only] [--run target1,target2]
    Default: docker compose up -d, wait healthy, bun dev (no TUI)
    --docker-only: start only docker services
    --dev-only: start only dev server (with TUI), auto-start services if needed
    --run: run only selected targets via turbo filters
           allowed: all, web, www, server, studio, read-receipt, message-search, message-indexer, notification
           example: scripts/dev.sh start --run web,server,studio
    Drizzle Studio runs outside Turbo (direct drizzle-kit); use --run studio to include it in filtered starts.
    Type generators (web, api, db) run automatically in watch mode alongside dev.
    Ctrl+C prompt: Docker services will stop in 5s. Press 'n' to keep them running...

  stop-services
    - docker compose stop

  reset-services
    - confirm
    - docker compose down --volumes --remove-orphans
    - rerun init after teardown
    - use --skip-init-steps to forward skip lists to the init --skip-steps

  update-packages
    - for each folder in apps/* packages/* workers/* with package.json
      run bun update --latest
    - remove all node_modules folders
    - remove bun.lock
    - bun install at root

  doctor
    - check deps
    - check env files
    - check services
    - check ports: 5432,5003,6379,5672,9200,9000,6001,8080

  logs [service]
    - docker compose logs -f [service]

  seed [--only=X]
    - bun run --cwd apps/seeder src/index.ts "$@"

  bootstrap-dev-workspace init step:
    - creates owner/admin/member dev users
    - creates the default organization, teams, and channels
    - enables org-wide direct messages for the bootstrap organization
    - writes USER1..USER7 credentials into apps/server/.env

Managed env files:
  apps/server/.env
  apps/web/.env
  apps/www/.env
  workers/notification/.env
  workers/message-search/.env
  workers/read-receipt/.env

VAPID generation:
  bunx web-push generate-vapid-keys --json
  shared across server/web/notification env files
  on failure, VAPID values remain empty

Auth secret generation:
  npx --yes auth secret
  fallback: bunx auth secret
  fallback: openssl rand -base64 32

Docker compose detection:
  prefers docker compose (v2), fallback docker-compose (v1)

Migration strategy:
  bun db:migrate

EOF
}

main() {
  local cmd="${1:-}"
  shift || true
  case "$cmd" in
  "" | --help | -h) cmd_help ;;
  init) cmd_init "$@" ;;
  start) cmd_start "$@" ;;
  stop-services) cmd_stop "$@" ;;
  reset-services) cmd_reset_services "$@" ;;
  update-packages) cmd_update_packages "$@" ;;
  doctor) cmd_doctor "$@" ;;
  status) cmd_status "$@" ;;
  logs) cmd_logs "$@" ;;
  seed) cmd_seed "$@" ;;
  *)
    log_error "Unknown command: $cmd"
    cmd_help
    exit 1
    ;;
  esac
}

main "$@"
